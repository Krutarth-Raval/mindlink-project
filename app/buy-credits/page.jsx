"use client";

import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const plans = [
    {
        name: "Starter",
        description: "Perfect for a quick career boost",
        price: "$9",
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
        price: "$18",
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
        price: "$49",
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
        <section className="py-24 bg-black text-white min-h-screen">
            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    Choose your Pricing Plan
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Get started with our flexible pricing plans designed to scale with
                    your business needs.
                </p>
            </div>

            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {plans.map((plan) => (
                    <Card
                        key={plan.name}
                        className={`flex flex-col border-none ${plan.highlight
                            ? "bg-[#1c1c1c] scale-105 shadow-2xl z-10"
                            : "bg-transparent"
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
                                <span className="text-5xl font-bold text-white">
                                    {plan.price}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    className={`w-full text-lg py-6 font-semibold transition-all duration-200 ${plan.highlight
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-[#1c1c1c] text-white hover:bg-[#2c2c2c]"
                                        }`}
                                >
                                    Get Started
                                </Button>

                                <ul className="space-y-4 mt-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 flex items-center justify-center bg-gray-600/30 rounded-full h-5 w-5">
                                                <Check className="h-3 w-3 text-gray-300" strokeWidth={3} />
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
        </section>
    );
};

export default BuyCredits;
