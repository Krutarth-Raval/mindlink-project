"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise HuggingFace / generic API errors into clean user-facing messages.
 */
function normaliseApiError(err) {
    const msg = err?.message ?? "";
    const status = err?.status ?? err?.statusCode ?? 0;

    if (status === 429 || msg.includes("rate limit") || msg.includes("quota")) {
        return "AI quota exceeded. Please try again later.";
    }
    if (status === 401 || msg.includes("Unauthorized") || msg.includes("invalid api key")) {
        return "Invalid API key. Please contact support.";
    }
    if (status === 503 || msg.includes("loading") || msg.includes("currently loading")) {
        return "Model is warming up. Please try again in a few seconds.";
    }
    if (
        status === 404 ||
        msg.includes("not found") ||
        msg.includes("does not exist")
    ) {
        return "Model not available. Please try again later.";
    }
    // Fallback — never leak raw API JSON
    return err?.message || "An unexpected error occurred.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAIContent({ prompt, type }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        const creditCost = type === "video" ? 5 : 1;

        // ── Credit Guard ────────────────────────────────────────────────────
        if ((user.credits ?? 0) < creditCost) {
            throw new Error(
                type === "video"
                    ? "Insufficient credits to generate video"
                    : "Free limit reached, please purchase credits"
            );
        }

        // ── Image Generation (HF · Tongyi-MAI/Z-Image-Turbo) ────────────────
        if (type === "image") {
            const { InferenceClient } = await import("@huggingface/inference");
            const client = new InferenceClient(process.env.HF_TOKEN);

            let imageUrl;
            try {
                // Returns a Blob
                const imageBlob = await client.textToImage({
                    provider: "wavespeed",
                    model: "Tongyi-MAI/Z-Image-Turbo",
                    inputs: prompt,
                });

                // Convert Blob → base64 data URL so the browser <img> can render it
                const arrayBuffer = await imageBlob.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");
                const mimeType = imageBlob.type || "image/jpeg";
                imageUrl = `data:${mimeType};base64,${base64}`;
            } catch (apiError) {
                console.error("HF Image API error:", apiError);
                throw new Error(normaliseApiError(apiError));
            }

            // Atomic credit decrement — prevents race conditions
            await db.user.update({
                where: { id: user.id },
                data: { credits: { decrement: creditCost } },
            });

            return {
                success: true,
                type: "image",
                url: imageUrl,
                creditsRemaining: user.credits - creditCost,
            };
        }

        // ── Video Generation (MiniMax · MiniMax-Hailuo-2.3) ─────────────────
        if (type === "video") {
            const minimaxApiKey = process.env.MINIMAX_API_KEY;
            if (!minimaxApiKey) throw new Error("MiniMax API key not configured.");

            const minimaxHeaders = {
                "Authorization": `Bearer ${minimaxApiKey}`,
                "Content-Type": "application/json",
            };

            let videoUrl;

            try {
                // Step 1 — Submit text-to-video task
                const submitRes = await fetch("https://api.minimax.io/v1/video_generation", {
                    method: "POST",
                    headers: minimaxHeaders,
                    body: JSON.stringify({
                        prompt,
                        model: "MiniMax-Hailuo-2.3",
                        duration: 6,
                        resolution: "1080P",
                    }),
                });

                if (!submitRes.ok) {
                    const errBody = await submitRes.text();
                    console.error("MiniMax submit error:", errBody);
                    throw new Error(`MiniMax submission failed (${submitRes.status}): ${errBody}`);
                }

                const submitData = await submitRes.json();
                // MiniMax returns business errors as 200 OK with base_resp.status_code != 0
                console.log("MiniMax submit response:", JSON.stringify(submitData));

                const baseResp = submitData?.base_resp;
                if (baseResp && baseResp.status_code !== 0) {
                    throw new Error(`MiniMax error: ${baseResp.status_msg ?? "Unknown error"}`);
                }

                const task_id = submitData?.task_id;
                if (!task_id) throw new Error("MiniMax did not return a task_id.");

                console.log(`MiniMax video task submitted. task_id: ${task_id}`);

                // Step 2 — Poll until success or failure (max ~5 min)
                let file_id = null;
                const MAX_POLLS = 30; // 30 × 10s = 5 minutes
                for (let i = 0; i < MAX_POLLS; i++) {
                    await new Promise((r) => setTimeout(r, 10_000)); // wait 10s

                    const pollRes = await fetch(
                        `https://api.minimax.io/v1/query/video_generation?task_id=${task_id}`,
                        { headers: minimaxHeaders }
                    );

                    if (!pollRes.ok) {
                        console.warn(`MiniMax poll error (attempt ${i + 1}):`, await pollRes.text());
                        continue;
                    }

                    const pollData = await pollRes.json();
                    console.log(`MiniMax task status [${i + 1}/${MAX_POLLS}]: ${pollData.status}`);

                    if (pollData.status === "Success") {
                        file_id = pollData.file_id;
                        break;
                    } else if (pollData.status === "Fail") {
                        throw new Error(
                            `MiniMax video generation failed: ${pollData.error_message ?? "Unknown error"}`
                        );
                    }
                    // Still Processing/Queueing — keep polling
                }

                if (!file_id) throw new Error("MiniMax video generation timed out.");

                // Step 3 — Retrieve download URL from file_id
                const fileRes = await fetch(
                    `https://api.minimax.io/v1/files/retrieve?file_id=${file_id}`,
                    { headers: minimaxHeaders }
                );

                if (!fileRes.ok) {
                    const errBody = await fileRes.text();
                    console.error("MiniMax file retrieve error:", errBody);
                    throw new Error("Failed to retrieve video file from MiniMax.");
                }

                const fileData = await fileRes.json();
                videoUrl = fileData?.file?.download_url;

                if (!videoUrl) throw new Error("MiniMax did not return a download URL.");

            } catch (apiError) {
                console.error("MiniMax Video API error:", apiError);
                throw new Error(apiError.message || "Video generation failed.");
            }

            // Deduct credits only after a confirmed successful generation
            await db.user.update({
                where: { id: user.id },
                data: { credits: { decrement: creditCost } },
            });

            return {
                success: true,
                type: "video",
                videoUrl,
                creditsRemaining: user.credits - creditCost,
            };
        }

        throw new Error("Invalid generation type");
    } catch (error) {
        console.error("Generation error:", error.message);
        throw new Error(error.message || "Failed to generate content");
    }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getUserCredits() {
    const { userId } = await auth();
    if (!userId) return 0;

    try {
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: { credits: true },
        });
        return user?.credits ?? 0;
    } catch (error) {
        console.error("Error fetching credits:", error);
        return 0;
    }
}
