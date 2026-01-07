import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, Wand2, RefreshCw, Download, Play, Pause, Move, AlertCircle } from 'lucide-react';
import { imageToVideo } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

const ImageToVideo = () => {
    const [image, setImage] = useState<string | null>(null);
    const [endImage, setEndImage] = useState<string | null>(null);
    const [useEndFrame, setUseEndFrame] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState('5');
    const [quality, setQuality] = useState('pro');
    const [motionAmount, setMotionAmount] = useState([50]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [motionBrushMode, setMotionBrushMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEnd: boolean = false) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (isEnd) {
                    setEndImage(event.target?.result as string);
                } else {
                    setImage(event.target?.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!image || !prompt.trim()) return;
        setIsGenerating(true);
        setError(null);

        try {
            const result = await imageToVideo(image, prompt, {
                duration: parseInt(duration),
                motionAmount: motionAmount[0],
            });

            if (result.success && result.videoUrl) {
                setGeneratedVideo(result.videoUrl);
                setIsPlaying(true);
                toast({
                    title: "Video Created!",
                    description: "Your image has been animated successfully",
                });
            } else {
                const errorMsg = result.error || 'Failed to animate image';
                setError(errorMsg);
                toast({
                    title: "Animation Failed",
                    description: errorMsg,
                    variant: "destructive",
                });
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMsg);
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-500 mb-4">
                            <Video className="w-4 h-4" />
                            <span className="text-sm font-medium">Image Animation</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Image to Video</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Bring your images to life with natural motion and cinematic animation
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Start Image */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Start Frame</label>
                                <label className="block cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e)}
                                        className="hidden"
                                    />
                                    {image ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden group">
                                            <img src={image} alt="Start frame" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-sm">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Upload start image</span>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* End Frame Toggle */}
                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Use End Frame</label>
                                    <Switch checked={useEndFrame} onCheckedChange={setUseEndFrame} />
                                </div>

                                {useEndFrame && (
                                    <label className="block cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, true)}
                                            className="hidden"
                                        />
                                        {endImage ? (
                                            <div className="relative aspect-video rounded-lg overflow-hidden group">
                                                <img src={endImage} alt="End frame" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-sm">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                                <div className="text-center">
                                                    <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">Upload end image</span>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            {/* Motion Brush */}
                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Move className="w-4 h-4" />
                                        <label className="text-sm font-medium">Motion Brush</label>
                                    </div>
                                    <Switch checked={motionBrushMode} onCheckedChange={setMotionBrushMode} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Draw arrows on the image to control motion direction
                                </p>
                            </div>

                            {/* Motion Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Motion Description</label>
                                <Textarea
                                    placeholder="Describe how the image should animate...&#10;&#10;Examples:&#10;• The woman slowly turns her head&#10;• Clouds drift across the sky&#10;• Water ripples gently"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Settings */}
                            <div className="tool-card p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Duration</label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 seconds</SelectItem>
                                                <SelectItem value="10">10 seconds</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Quality</label>
                                        <Select value={quality} onValueChange={setQuality}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="std">Standard</SelectItem>
                                                <SelectItem value="pro">Professional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium">Motion Intensity</label>
                                        <span className="text-sm text-muted-foreground">{motionAmount[0]}%</span>
                                    </div>
                                    <Slider value={motionAmount} onValueChange={setMotionAmount} min={0} max={100} />
                                </div>
                            </div>

                            {/* Generate */}
                            <Button
                                onClick={handleGenerate}
                                disabled={!image || !prompt.trim() || isGenerating}
                                className="w-full h-14 text-lg gradient-primary"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Animating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5 mr-2" />
                                        Animate Image
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {generatedVideo ? (
                                        <>
                                            <video
                                                src={generatedVideo}
                                                className="w-full h-full object-contain"
                                                loop
                                                autoPlay={isPlaying}
                                                muted
                                            />
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setIsPlaying(!isPlaying)}
                                                >
                                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </Button>
                                                <Button size="sm" variant="secondary">
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </>
                                    ) : image && motionBrushMode ? (
                                        <div className="relative w-full h-full">
                                            <img src={image} alt="Source" className="w-full h-full object-contain" />
                                            <canvas
                                                ref={canvasRef}
                                                className="absolute inset-0 w-full h-full cursor-crosshair"
                                            />
                                            <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-2">
                                                <p className="text-white text-sm">Draw motion arrows</p>
                                            </div>
                                        </div>
                                    ) : image ? (
                                        <img src={image} alt="Source" className="w-full h-full object-contain opacity-50" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Video className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Upload an Image</h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    Your animated video will appear here
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-xl font-semibold mb-2">Animating Image</p>
                                                <p className="text-muted-foreground">Creating natural motion...</p>
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

export default ImageToVideo;
