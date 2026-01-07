import { useState } from 'react';
import { generateVideo, getVideoStatus, VideoGenerationRequest } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

export const useVideoGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const createVideo = async (prompt: string, options: Partial<VideoGenerationRequest> = {}) => {
        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);

        try {
            const res = await generateVideo(prompt, options);

            if (res.success && res.operationName) {
                toast({
                    title: "Generation Started",
                    description: "Your video is being processed. This may take a few minutes...",
                });

                // Polling loop
                let done = false;
                const pollInterval = 10000; // 10 seconds

                while (!done) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    const status = await getVideoStatus(res.operationName);

                    if (status.done) {
                        done = true;
                        if (status.videoUrl) {
                            setVideoUrl(status.videoUrl);
                            toast({
                                title: "Video Ready!",
                                description: "Your video has been created successfully.",
                            });
                            return status.videoUrl;
                        } else if (status.error) {
                            setError(status.error);
                            toast({
                                title: "Generation Failed",
                                description: status.error,
                                variant: "destructive",
                            });
                        }
                    }
                }
            } else {
                const errorMsg = res.error || "Failed to start generation";
                setError(errorMsg);
                toast({
                    title: "Initialization Failed",
                    description: errorMsg,
                    variant: "destructive",
                });
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An error occurred";
            setError(errorMsg);
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
        return null;
    };

    return {
        isGenerating,
        videoUrl,
        error,
        createVideo,
        setVideoUrl
    };
};
