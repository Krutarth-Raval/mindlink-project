"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { generateAIContent } from "@/actions/generation";
import { toast } from "sonner";
import {
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Film,
    Download,
    Trash2,
    Cpu,
    Zap,
    Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Real model metadata shown in the UI ──────────────────────────────────────
const MODELS = {
    image: {
        name: "Z-Image Turbo",
        provider: "Tongyi-MAI",
        engine: "Hugging Face · WaveSpeed",
        tag: "Fast · 1 Credit",
        badge: "HF",
        description: "High-quality text-to-image generation powered by Tongyi-MAI's Z-Image Turbo model via the WaveSpeed inference engine.",
        specs: [
            { label: "Output", value: "1024 × 1024 px" },
            { label: "Style", value: "Photorealistic" },
            { label: "Provider", value: "WaveSpeed" },
            { label: "Cost", value: "1 credit" },
        ],
    },
    video: {
        name: "Zeroscope v2 XL",
        provider: "anotherjesse",
        engine: "Replicate",
        tag: "~30 s · 5 Credits",
        badge: "REP",
        description: "Cinematic text-to-video generation using Zeroscope v2 XL on Replicate. Produces smooth, high-fidelity short clips.",
        specs: [
            { label: "Output", value: "1024 × 576 · MP4" },
            { label: "Steps", value: "20 inference" },
            { label: "Provider", value: "Replicate" },
            { label: "Cost", value: "5 credits" },
        ],
    },
};

const formSchema = z.object({
    prompt: z.string().min(5, { message: "Prompt must be at least 5 characters." }),
    type: z.enum(["image", "video"]),
});

export default function GenerationStudio({ initialCredits }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { prompt: "", type: "image" },
    });

    const selectedType = form.watch("type");
    const model = MODELS[selectedType];
    const creditCost = selectedType === "video" ? 5 : 1;

    const onSubmit = async (values) => {
        if (initialCredits < creditCost) {
            toast.error(selectedType === "video" ? "Insufficient credits for video generation" : "Free limit reached — purchase credits to continue");
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const data = await generateAIContent(values);
            if (data.success) {
                setResult(data);
                toast.success("Generation complete!");
                router.refresh();
            }
        } catch (error) {
            toast.error(error.message || "Failed to generate");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const href = result?.url || result?.videoUrl;
        if (!href) return;
        const a = document.createElement("a");
        a.href = href;
        a.download = `mindlink-${result.type}-${Date.now()}`;
        a.click();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* ── Left panel: Controls ─────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

                {/* Mode toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl border">
                    {["image", "video"].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { form.setValue("type", t); setResult(null); }}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedType === t
                                    ? "bg-background shadow text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t === "image" ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                            {t === "image" ? "Image" : "Video"}
                        </button>
                    ))}
                </div>

                {/* Model info card */}
                <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                                {model.engine}
                            </p>
                            <h3 className="font-semibold text-sm leading-tight">{model.provider} / {model.name}</h3>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            {model.badge}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {model.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {model.specs.map((s) => (
                            <div key={s.label} className="bg-muted/40 rounded-lg px-3 py-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                                <p className="text-xs font-semibold mt-0.5">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prompt form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder={
                                                selectedType === "image"
                                                    ? "A lone astronaut standing on a red desert planet at golden hour, ultra-realistic, cinematic…"
                                                    : "A timelapse of clouds rolling over misty mountain peaks at dawn, cinematic 4K…"
                                            }
                                            className="min-h-[140px] text-sm resize-none bg-muted/20 border focus-visible:ring-1 focus-visible:ring-primary/40 transition-all"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full h-11 font-medium"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {selectedType === "video" ? "Rendering (~30s)…" : "Generating…"}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate · {creditCost} credit{creditCost > 1 ? "s" : ""}
                                </>
                            )}
                        </Button>
                    </form>
                </Form>

                {/* Credit balance note */}
                <p className="text-center text-xs text-muted-foreground">
                    Balance: <span className="font-semibold text-foreground">{initialCredits} credits</span>
                </p>
            </div>

            {/* ── Right panel: Output canvas ───────────────────────────────── */}
            <div className="lg:col-span-3">
                <div className={`rounded-xl border bg-card overflow-hidden flex flex-col min-h-[560px] transition-all`}>

                    {/* Canvas top bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Cpu className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground font-medium">
                                {model.provider} / {model.name}
                            </span>
                        </div>
                        {result && (
                            <div className="flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={handleDownload}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => setResult(null)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                        {!result && <div className="w-16" />}
                    </div>

                    {/* Canvas body */}
                    <div className="flex-1 flex items-center justify-center p-6">
                        {/* Empty state */}
                        {!result && !loading && (
                            <div className="text-center space-y-3 max-w-xs">
                                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl border-2 border-dashed bg-muted/30 text-muted-foreground/40">
                                    {selectedType === "image"
                                        ? <ImageIcon className="h-6 w-6" />
                                        : <Film className="h-6 w-6" />}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Write a prompt and hit <span className="font-medium text-foreground">Generate</span> to create your {selectedType}.
                                </p>
                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
                                    <Zap className="h-3 w-3" />
                                    <span>Powered by {model.engine}</span>
                                </div>
                            </div>
                        )}

                        {/* Loading state */}
                        {loading && (
                            <div className="text-center space-y-4 max-w-xs">
                                <div className="relative h-14 w-14 mx-auto">
                                    <div className="absolute inset-0 rounded-full border-2 border-muted border-t-primary animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        {selectedType === "video" ? "Rendering video…" : "Generating image…"}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {selectedType === "video" ? "Usually takes ~30 seconds" : "Usually takes ~5–10 seconds"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                                        {model.provider} / {model.name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                                {result.type === "image" ? (
                                    <img
                                        src={result.url}
                                        alt="Generated image"
                                        className="max-h-[460px] max-w-full rounded-lg object-contain shadow-md"
                                    />
                                ) : (
                                    <video
                                        src={result.videoUrl}
                                        controls
                                        autoPlay
                                        className="max-h-[460px] max-w-full rounded-lg shadow-md"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom meta bar (only when result shown) */}
                    {result && (
                        <div className="px-4 py-2 border-t bg-muted/10 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">
                                {model.provider} / <span className="font-medium text-foreground">{model.name}</span>
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {result.creditsRemaining} credits remaining
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
