import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await req.json();

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return new NextResponse("Invalid Signature", { status: 400 });
        }

        // Get payment details to extract notes
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const { userId, credits, planName } = payment.notes;

        if (!userId || !credits) {
            return new NextResponse("Invalid Metadata", { status: 400 });
        }

        // Check if transaction already processed (to avoid double updates)
        const existingTx = await db.paymentHistory.findUnique({
            where: { paymentId: razorpay_payment_id }
        });

        if (existingTx) {
            return NextResponse.json({ success: true, message: "Already processed" });
        }

        // Atomic Update: credits and payment history
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
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("RAZORPAY_VERIFY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
