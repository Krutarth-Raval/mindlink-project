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

        // ── Video Generation (RunwayML / HF) ──────────────────────────
        if (type === "video") {
            const runwayKey = process.env.RUNWAY_API_KEY;
            const runwayVersion = process.env.RUNWAY_VERSION || "2024-11-06";

            if (runwayKey) {
                console.log("Submitting RunwayML text-to-video task (gen4.5)...");
                try {
                    const runwayBase = "https://api.dev.runwayml.com/v1";
                    const response = await fetch(`${runwayBase}/text_to_video`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${runwayKey}`,
                            "X-Runway-Version": runwayVersion,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model: "gen4.5",
                            promptText: prompt,
                            ratio: "1280:720",
                            duration: 5,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(normaliseApiError({
                            status: response.status,
                            message: errorData.error || errorData.message || "RunwayML submission failed"
                        }));
                    }

                    const task = await response.json();
                    const taskId = task.id;
                    console.log("RunwayML task created:", taskId);

                    // Polling for completion (max 5 minutes)
                    let videoUrl;
                    for (let i = 0; i < 30; i++) {
                        await new Promise((r) => setTimeout(r, 10000));
                        const pollRes = await fetch(`${runwayBase}/tasks/${taskId}`, {
                            headers: {
                                "Authorization": `Bearer ${runwayKey}`,
                                "X-Runway-Version": runwayVersion,
                            },
                        });

                        if (!pollRes.ok) continue;

                        const pollData = await pollRes.json();
                        console.log(`Polling RunwayML [${taskId}] - Status: ${pollData.status}`);

                        if (pollData.status === "SUCCEEDED" || pollData.status === "COMPLETE") {
                            videoUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
                            break;
                        } else if (pollData.status === "FAILED") {
                            throw new Error("RunwayML generation failed: " + (pollData.failure || "Unknown error"));
                        }
                    }

                    if (!videoUrl) throw new Error("RunwayML video generation timed out.");

                    // Success! Deduct credits
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

                } catch (runwayError) {
                    console.error("RunwayML Error:", runwayError.message);
                    // Fall back to HF if Runway fails only if it's a transient error? 
                    // No, let's just throw for now to respect the user's key choice.
                    throw runwayError;
                }
            }

            // --- Fallback to HuggingFace (Wan-AI) if Runway Key is missing ---
            const { InferenceClient } = await import("@huggingface/inference");
            const client = new InferenceClient(process.env.HF_TOKEN);

            let videoUrl;
            try {
                console.log("Submitting HF text-to-video task (Wan-AI)...");
                const videoBlob = await client.textToVideo({
                    provider: "fal-ai",
                    model: "Wan-AI/Wan2.1-T2V-14B",
                    inputs: prompt,
                });

                const arrayBuffer = await videoBlob.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");
                const mimeType = videoBlob.type || "video/mp4";
                videoUrl = `data:${mimeType};base64,${base64}`;

            } catch (apiError) {
                console.error("HF Video API error:", apiError);
                throw new Error(normaliseApiError(apiError));
            }

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
