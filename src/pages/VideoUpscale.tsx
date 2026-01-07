import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, Film, Sparkles, RefreshCw, Download, Gauge, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVideoGeneration } from '@/hooks/use-video-generation';

const VideoUpscale = () => {
    const [video, setVideo] = useState<string | null>(null);
    const [resolution, setResolution] = useState('4k');
    const [frameRate, setFrameRate] = useState('60');
    const [slowMotion, setSlowMotion] = useState(false);
    const [slowMotionFactor, setSlowMotionFactor] = useState([2]);
    const [denoise, setDenoise] = useState([30]);
    const { isGenerating: isProcessing, videoUrl: result, error, createVideo, setVideoUrl: setResult } = useVideoGeneration();

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideo(url);
            setResult(null);
        }
    };

    const handleUpscale = async () => {
        if (!video) return;
        const upscalePrompt = `Upscale this video to ${resolution.toUpperCase()} resolution. Enhance details, remove noise (${denoise[0]}%), and interpolate to ${frameRate}fps. ${slowMotion ? `Apply ${slowMotionFactor[0]}x slow motion.` : ''}`;

        await createVideo(upscalePrompt, {
            imageUrl: video,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 mb-4">
                            <Film className="w-4 h-4" />
                            <span className="text-sm font-medium">Video Enhancement</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Video Upscale</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Enhance videos up to 8K resolution and interpolate frames for ultra-smooth playback
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Video Upload */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Source Video</label>
                                <label className="block cursor-pointer">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                    />
                                    {video ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                                            <video src={video} className="w-full h-full object-contain" muted />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <span className="text-white">Change Video</span>
                                            </div>
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

                            {/* Resolution */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Target Resolution</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: '2k', label: '2K', desc: '2560×1440' },
                                        { id: '4k', label: '4K', desc: '3840×2160' },
                                        { id: '8k', label: '8K', desc: '7680×4320' },
                                    ].map((res) => (
                                        <button
                                            key={res.id}
                                            onClick={() => setResolution(res.id)}
                                            className={`p-3 rounded-lg border text-center transition-all ${resolution === res.id
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="font-bold block">{res.label}</span>
                                            <span className="text-xs text-muted-foreground">{res.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frame Rate */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Frame Interpolation</label>
                                <Select value={frameRate} onValueChange={setFrameRate}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="original">Keep Original FPS</SelectItem>
                                        <SelectItem value="30">30 FPS</SelectItem>
                                        <SelectItem value="60">60 FPS</SelectItem>
                                        <SelectItem value="120">120 FPS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Slow Motion */}
                            <div className="tool-card p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Gauge className="w-4 h-4" />
                                        <label className="text-sm font-medium">Slow Motion</label>
                                    </div>
                                    <Switch checked={slowMotion} onCheckedChange={setSlowMotion} />
                                </div>

                                {slowMotion && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Slow Factor</span>
                                            <span className="text-sm font-medium">{slowMotionFactor[0]}x</span>
                                        </div>
                                        <Slider
                                            value={slowMotionFactor}
                                            onValueChange={setSlowMotionFactor}
                                            min={2}
                                            max={8}
                                            step={1}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Denoise */}
                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Denoise</label>
                                    <span className="text-sm text-muted-foreground">{denoise[0]}%</span>
                                </div>
                                <Slider value={denoise} onValueChange={setDenoise} min={0} max={100} />
                            </div>

                            {/* Upscale Button */}
                            <Button
                                onClick={handleUpscale}
                                disabled={!video || isProcessing}
                                className="w-full h-14 text-lg gradient-primary"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Upscaling...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Upscale Video
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">
                                        {result ? 'Enhanced Video' : 'Preview'}
                                    </h3>
                                    {result && (
                                        <Button size="sm" variant="outline">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download {resolution.toUpperCase()}
                                        </Button>
                                    )}
                                </div>

                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? (
                                        <video
                                            src={result}
                                            className="w-full h-full object-contain"
                                            controls
                                            autoPlay
                                            loop
                                        />
                                    ) : video ? (
                                        <video
                                            src={video}
                                            className="w-full h-full object-contain"
                                            controls
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Film className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Upload a Video</h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    Enhance resolution and frame rate with AI
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-xl font-semibold mb-2">Enhancing Video</p>
                                                <p className="text-muted-foreground">
                                                    Upscaling to {resolution.toUpperCase()} @ {frameRate}fps
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {video && (
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-muted-foreground">Original</p>
                                            <p className="font-medium">720p @ 24fps</p>
                                        </div>
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <p className="text-muted-foreground">Enhanced</p>
                                            <p className="font-medium text-primary">
                                                {resolution.toUpperCase()} @ {frameRate}fps
                                                {slowMotion && ` (${slowMotionFactor[0]}x slow)`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VideoUpscale;
