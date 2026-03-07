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
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateAIContent } from "@/actions/generation";
import { toast } from "sonner";
import { Loader2, Sparkles, Image as ImageIcon, Film } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    prompt: z.string().min(5, {
        message: "Prompt must be at least 5 characters.",
    }),
    type: z.enum(["image", "video"], {
        required_error: "Please select a generation type.",
    }),
});

export default function GenerationForm({ initialCredits }) {
    const [loading, setLoading] = useState(false);
    const [generatedResult, setGeneratedResult] = useState(null);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: "",
            type: "image",
        },
    });

    const onSubmit = async (values) => {
        const cost = values.type === "video" ? 5 : 1;

        if (initialCredits < cost) {
            toast.error(values.type === "video" ? "Insufficient credits to generate video" : "Free limit reached, please purchase credits");
            return;
        }

        setLoading(true);
        setGeneratedResult(null);

        try {
            const result = await generateAIContent(values);
            if (result.success) {
                toast.success(`${values.type === "image" ? "Image" : "Video"} generated successfully!`);
                setGeneratedResult(result);
                router.refresh(); // Refresh to update credits display
            }
        } catch (error) {
            toast.error(error.message || "Failed to generate content");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <Card className="border-2 shadow-lg">
                <CardHeader>
                    <CardTitle>Creative Prompt</CardTitle>
                    <CardDescription>
                        Describe what you want to create in detail for better results.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Generation Type <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Tabs
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="w-full"
                                            >
                                                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 border">
                                                    <TabsTrigger
                                                        value="image"
                                                        className="flex items-center gap-2 text-base data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                        Generate Image
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="video"
                                                        className="flex items-center gap-2 text-base data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                                    >
                                                        <Film className="h-4 w-4" />
                                                        Generate Video
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Prompt</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={
                                                    form.watch("type") === "image"
                                                        ? "A futuristic city at sunset with neon lights, digital art style..."
                                                        : "A majestic waterfall in a lush jungle, cinematic 4k video..."
                                                }
                                                className="min-h-[120px] text-lg p-4 resize-none border-2 focus-visible:ring-primary/20 transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generating Magic...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Create {form.watch("type") === "image" ? "Image" : "Video"}
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Result Display Section */}
            {generatedResult && (
                <Card className="border-2 border-primary/20 overflow-hidden bg-muted/30 animate-in fade-in zoom-in duration-500">
                    <CardHeader className="bg-muted/50 border-b">
                        <CardTitle className="flex justify-between items-center">
                            <span>Result</span>
                            <Button variant="outline" size="sm" onClick={() => window.open(generatedResult.url || generatedResult.videoUrl, '_blank')}>
                                Download
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex justify-center items-center min-h-[400px]">
                        {generatedResult.type === "image" ? (
                            <div className="flex flex-col items-center gap-4 p-8">
                                <div className="relative group rounded-lg overflow-hidden border shadow-2xl bg-background max-w-xl">
                                    {generatedResult.url ? (
                                        <img
                                            src={generatedResult.url}
                                            alt="Generated"
                                            className="w-full h-auto object-contain"
                                        />
                                    ) : (
                                        <div className="w-[512px] h-[512px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-10 text-center text-white">
                                            <div>
                                                <ImageIcon className="h-20 w-20 mx-auto mb-4 opacity-50" />
                                                <h3 className="text-2xl font-bold mb-2">Image Generated!</h3>
                                                <p className="opacity-80">Your image has been created successfully.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full aspect-video bg-black flex items-center justify-center">
                                {generatedResult.videoUrl ? (
                                    <video
                                        src={generatedResult.videoUrl}
                                        controls
                                        className="max-h-[600px] w-full"
                                        autoPlay
                                    />
                                ) : (
                                    <div className="text-white text-center p-10">
                                        <Film className="h-20 w-20 mx-auto mb-4 opacity-50" />
                                        <h3 className="text-2xl font-bold mb-2">Video Generation Initiated</h3>
                                        <p className="opacity-80">Your video is being processed by Pika (Vidu). Check your dashboard for the final result.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
