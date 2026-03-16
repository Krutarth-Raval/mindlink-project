"use client";

import { useState, Suspense } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const plans = [
    {
        id: "starter",
        name: "Starter",
        description: "Perfect for a quick career boost",
        price: 99,
        credits: 10,
        features: [
            "10 AI Credits",
            "build 5 Resumes",
            "5 Mock Interview Sessions",
            "build 10 Cover Letters"
        ],
    },
    {
        id: "premium",
        name: "Premium",
        description: "Best for active job seekers",
        price: 199,
        credits: 20,
        features: [
            "20 AI Credits",
            "build 10 Resumes",
            "10 Mock Interview Sessions",
            "build 20 Cover Letters"
        ],
        highlight: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "For long-term career growth",
        price: 499,
        credits: 100,
        features: [
            "100 AI Credits",
            "build 50 Resumes",
            "50 Mock Interview Sessions",
            "build 100 Cover Letters"
        ],
    },
];

const BuyCreditsContent = () => {
    const [loadingPlan, setLoadingPlan] = useState(null);
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/dashboard";

    const handlePurchase = async (plan) => {
        if (!user) {
            toast.error("Please login to purchase credits");
            return;
        }

        try {
            setLoadingPlan(plan.id);
            
            // 1. Create Order
            const response = await fetch("/api/payments/create-order", {
                method: "POST",
                body: JSON.stringify({ planId: plan.id }),
            });

            if (!response.ok) throw new Error("Failed to create order");
            const orderData = await response.json();

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "MindLink AI",
                description: `Purchase ${plan.credits} credits`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch("/api/payments/verify", {
                            method: "POST",
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            toast.success("Payment successful! Credits added.");
                            router.push(redirectUrl);
                            router.refresh();
                        } else {
                            toast.error("Payment verification failed. Please contact support.");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Error verifying payment.");
                    }
                },
                prefill: {
                    name: user.fullName || "",
                    email: user.primaryEmailAddress?.emailAddress || "",
                },
                theme: {
                    color: "#4f46e5",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            toast.error("Failed to initiate payment");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section className="py-24 bg-black text-white min-h-screen relative overflow-hidden">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 text-center mb-16 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    Special Launch Offers
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                    Pricing Plans
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Choose the best plan to supercharge your career.
                </p>
            </div>

            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch relative z-10">
                {plans.map((plan) => (
                    <Card
                        key={plan.name}
                        className={`flex flex-col border-white/10 ${plan.highlight
                            ? "bg-[#0a0a0a] scale-105 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] z-10 border-indigo-500/50"
                            : "bg-[#050505]"
                            }`}
                    >
                        <CardHeader className="text-left pt-8">
                            <CardTitle className="text-2xl font-bold text-white mb-2">
                                {plan.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-base">
                                {plan.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-grow text-left pt-2 pb-6">
                            <div className="mb-6">
                                <span className="text-5xl font-bold text-white tracking-tight">
                                    ₹{plan.price}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => handlePurchase(plan)}
                                    disabled={loadingPlan === plan.id}
                                    className={`w-full text-lg py-6 font-semibold transition-all duration-200 ${plan.highlight
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                                        }`}
                                >
                                    {loadingPlan === plan.id ? "Processing..." : "Buy Credits"}
                                </Button>

                                <ul className="space-y-4 mt-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 flex items-center justify-center bg-white/5 rounded-full h-5 w-5 border border-white/10">
                                                <Check className="h-3 w-3 text-indigo-400" strokeWidth={3} />
                                            </div>
                                            <span className="text-gray-300 text-sm whitespace-nowrap">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-20 text-center relative z-10">
                <p className="text-gray-500 text-sm">
                    Secured by Razorpay. All transactions are encrypted.
                </p>
            </div>
        </section>
    );
};

export default function BuyCreditsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
            <BuyCreditsContent />
        </Suspense>
    );
}
