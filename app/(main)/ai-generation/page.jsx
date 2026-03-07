import { Suspense } from "react";
import { getUserCredits } from "@/actions/generation";
import GenerationStudio from "./_components/generation-studio";

export const metadata = {
    title: "AI Studio · MindLink",
    description: "Generate images and videos with Tongyi-MAI Z-Image Turbo and Zeroscope v2 XL.",
};

export default async function AIGenerationPage() {
    const credits = await getUserCredits();

    return (
        <div className="min-h-screen bg-background pt-20 pb-16 px-4">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Page header */}
                <div className="space-y-1 border-b pb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">AI Studio</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Generate images with <span className="font-medium text-foreground">Tongyi-MAI / Z-Image Turbo</span> · videos with <span className="font-medium text-foreground">Zeroscope v2 XL</span> via Replicate.
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance</p>
                            <p className="text-lg font-semibold">{credits} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
                        </div>
                    </div>
                </div>

                {/* Studio */}
                <Suspense
                    fallback={
                        <div className="h-[560px] w-full bg-muted/20 animate-pulse rounded-xl border flex items-center justify-center text-sm text-muted-foreground">
                            Loading studio…
                        </div>
                    }
                >
                    <GenerationStudio initialCredits={credits} />
                </Suspense>
            </div>
        </div>
    );
}
