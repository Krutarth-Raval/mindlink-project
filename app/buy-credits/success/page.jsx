"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/buy-credits");
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <p className="text-gray-400">Redirecting...</p>
        </div>
    );
}
