import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/prisma";

export async function POST(req) {
    try {
        const signature = req.headers.get("x-razorpay-signature");
        const body = await req.text();

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return new NextResponse("Invalid Signature", { status: 400 });
        }

        const event = JSON.parse(body);

        if (event.event === "payment.captured") {
            const payment = event.payload.payment.entity;
            const { userId, credits, planName } = payment.notes;

            if (userId && credits) {
                // Check if already processed by the verify endpoint
                const existingTx = await db.paymentHistory.findFirst({
                    where: { paymentId: payment.id }
                });

                if (!existingTx) {
                    await db.$transaction([
                        db.user.update({
                            where: { id: userId },
                            data: {
                                credits: { increment: parseInt(credits) },
                            },
                        }),
                        db.paymentHistory.create({
                            data: {
                                userId,
                                planName: planName || "Credit Purchase",
                                creditsAdded: parseInt(credits),
                                amountPaid: payment.amount / 100,
                                paymentId: payment.id,
                                orderId: payment.order_id,
                            },
                        }),
                    ]);
                    console.log(`Webhook: Credited ${credits} to user ${userId}`);
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("RAZORPAY_WEBHOOK_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
