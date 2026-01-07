import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Upload, Eraser, Wand2, RefreshCw, Download, Play, Pause, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVideoGeneration } from '@/hooks/use-video-generation';

const RemoveFromVideo = () => {
    const [video, setVideo] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const { isGenerating: isProcessing, videoUrl: result, error, createVideo, setVideoUrl: setResult } = useVideoGeneration();

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideo(url);
            setResult(null);
        }
    };

    const [brushSize, setBrushSize] = useState([30]);

    const handleRemove = async () => {
        if (!video || !prompt.trim()) return;
        await createVideo(`Remove ${prompt} from this video. Fill the removed area seamlessly with the background.`, {
            imageUrl: video,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 mb-4">
                            <Eraser className="w-4 h-4" />
                            <span className="text-sm font-medium">Object Removal</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Remove from Video</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Remove any object, person, or element from your videos with AI
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Source Video</label>
                                <label className="block cursor-pointer">
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                    {video ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                                            <video src={video} className="w-full h-full object-contain" muted />
                                        </div>
                                    ) : (
                                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Upload video</span>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">What to Remove</label>
                                <Textarea
                                    placeholder="Describe what to remove...&#10;&#10;Examples:&#10;• The person in the background&#10;• The watermark in the corner&#10;• The car on the left"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Selection Precision</label>
                                    <span className="text-sm text-muted-foreground">{brushSize[0]}%</span>
                                </div>
                                <Slider value={brushSize} onValueChange={setBrushSize} min={10} max={100} />
                            </div>

                            <Button onClick={handleRemove} disabled={!video || !prompt.trim() || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? (
                                    <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Removing...</>
                                ) : (
                                    <><Eraser className="w-5 h-5 mr-2" />Remove Object</>
                                )}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? (
                                        <video src={result} className="w-full h-full object-contain" controls autoPlay loop />
                                    ) : video ? (
                                        <video src={video} className="w-full h-full object-contain" controls />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Eraser className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Upload a Video</h3>
                                                <p className="text-muted-foreground">Remove unwanted elements seamlessly</p>
                                            </div>
                                        </div>
                                    )}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-xl font-semibold">Removing objects...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RemoveFromVideo;
