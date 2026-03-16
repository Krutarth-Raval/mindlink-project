import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const PLAN_MAPPING = {
    starter: { price: 99, credits: 10, name: "Starter Plan" },
    premium: { price: 199, credits: 20, name: "Premium Plan" },
    enterprise: { price: 499, credits: 100, name: "Enterprise Plan" },
};

export async function POST(req) {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { planId } = await req.json();
        const plan = PLAN_MAPPING[planId];

        if (!plan) {
            return new NextResponse("Invalid Plan", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const options = {
            amount: plan.price * 100, // Razorpay works in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: user.id,
                credits: plan.credits.toString(),
                planName: plan.name,
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        console.error("RAZORPAY_ORDER_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
