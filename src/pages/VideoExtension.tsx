import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FastForward, Wand2, RefreshCw, Download, Play, Pause, ArrowRight } from 'lucide-react';

const VideoExtension = () => {
    const [video, setVideo] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [quality, setQuality] = useState('pro');
    const [isProcessing, setIsProcessing] = useState(false);
    const [extendedVideo, setExtendedVideo] = useState<string | null>(null);
    const [extensions, setExtensions] = useState<number>(0);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideo(url);
            setExtendedVideo(null);
            setExtensions(0);
        }
    };

    const handleExtend = () => {
        if (!video) return;
        setIsProcessing(true);

        setTimeout(() => {
            setExtendedVideo('https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4');
            setExtensions(prev => prev + 1);
            setIsProcessing(false);
        }, 4000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 mb-4">
                            <FastForward className="w-4 h-4" />
                            <span className="text-sm font-medium">Video Extension</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Extend Video</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Seamlessly extend your videos forward or backward by 4-5 seconds, up to 3 minutes total
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

                            {/* Direction */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Extension Direction</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setDirection('forward')}
                                        className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${direction === 'forward'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        Forward
                                    </button>
                                    <button
                                        onClick={() => setDirection('backward')}
                                        className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${direction === 'backward'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <ArrowRight className="w-4 h-4 rotate-180" />
                                        Backward
                                    </button>
                                </div>
                            </div>

                            {/* Continuation Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">
                                    Continuation Prompt <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <Textarea
                                    placeholder="Guide what happens next...&#10;&#10;Leave empty for automatic continuation"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[80px] resize-none"
                                />
                            </div>

                            {/* Quality */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Quality Mode</label>
                                <Select value={quality} onValueChange={setQuality}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="std">Standard (Faster)</SelectItem>
                                        <SelectItem value="pro">Professional (Better)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Extension Count */}
                            {extensions > 0 && (
                                <div className="tool-card p-4 text-center">
                                    <p className="text-sm text-muted-foreground">Extensions made</p>
                                    <p className="text-2xl font-bold text-primary">{extensions}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ≈ {extensions * 5}s added (max 3 min)
                                    </p>
                                </div>
                            )}

                            {/* Extend Button */}
                            <Button
                                onClick={handleExtend}
                                disabled={!video || isProcessing}
                                className="w-full h-14 text-lg gradient-primary"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Extending...
                                    </>
                                ) : (
                                    <>
                                        <FastForward className="w-5 h-5 mr-2" />
                                        Extend Video (+5s)
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">
                                        {extendedVideo ? 'Extended Video' : 'Preview'}
                                    </h3>
                                    {extendedVideo && (
                                        <Button size="sm" variant="outline">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    )}
                                </div>

                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {extendedVideo ? (
                                        <video
                                            src={extendedVideo}
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
                                                <FastForward className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Upload a Video</h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    Extend any video seamlessly with AI-generated continuation
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-xl font-semibold mb-2">Extending Video</p>
                                                <p className="text-muted-foreground">Creating seamless continuation...</p>
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

export default VideoExtension;
