"use client";

import React from "react";
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
        name: "Starter",
        description: "Perfect for a quick career boost",
        price: "₹99",
        features: [
            "10 AI Credits",
            "build 5 Resumes",
            "5 Mock Interview Sessions",
            "build 10 Cover Letters"
        ],
    },
    {
        name: "Premium",
        description: "Best for active job seekers",
        price: "₹199",
        features: [
            "20 AI Credits",
            "build 10 Resumes",
            "10 Mock Interview Sessions",
            "build 20 Cover Letters"
        ],
        highlight: true,
    },
    {
        name: "Enterprise",
        description: "For long-term career growth",
        price: "₹499",
        features: [
            "100 AI Credits",
            "build 50 Resumes",
            "50 Mock Interview Sessions",
            "build 100 Cover Letters"
        ],
    },
];

const BuyCredits = () => {
    return (
        <section className="py-24 bg-black text-white min-h-screen relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 text-center mb-16 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    Coming Soon
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                    Pricing Plans
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    We are working on bringing you the best experience for purchasing credits. 
                    Online payments will be enabled very soon!
                </p>
            </div>

            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative z-10">
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
                                    {plan.price}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    disabled
                                    className={`w-full text-lg py-6 font-semibold transition-all duration-200 opacity-50 cursor-not-allowed ${plan.highlight
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white/5 text-gray-400 border border-white/10"
                                        }`}
                                >
                                    Available Soon
                                </Button>

                                <ul className="space-y-4 mt-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 flex items-center justify-center bg-white/5 rounded-full h-5 w-5 border border-white/10">
                                                <Check className="h-3 w-3 text-gray-400" strokeWidth={3} />
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
                    In a hurry? Stay tuned or contact support for manual credit addition.
                </p>
            </div>
        </section>
    );
};

export default BuyCredits;
