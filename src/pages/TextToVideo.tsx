import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Wand2, RefreshCw, Download, Play, Pause, Settings2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVideoGeneration } from '@/hooks/use-video-generation';

const videoModels = [
    { id: 'veo-3', label: 'Veo 3 Preview', description: 'Google AI' },
];

const cameraPresets = [
    { id: 'static', label: 'Static', icon: '📷' },
    { id: 'pan-left', label: 'Pan Left', icon: '⬅️' },
    { id: 'pan-right', label: 'Pan Right', icon: '➡️' },
    { id: 'tilt-up', label: 'Tilt Up', icon: '⬆️' },
    { id: 'tilt-down', label: 'Tilt Down', icon: '⬇️' },
    { id: 'zoom-in', label: 'Zoom In', icon: '🔍' },
    { id: 'zoom-out', label: 'Zoom Out', icon: '🔎' },
    { id: 'dolly', label: 'Dolly', icon: '🎥' },
    { id: 'orbit', label: 'Orbit', icon: '🔄' },
    { id: 'crane', label: 'Crane', icon: '🏗️' },
    { id: 'fpv', label: 'FPV', icon: '🚁' },
    { id: 'handheld', label: 'Handheld', icon: '✋' },
];

const TextToVideo = () => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [duration, setDuration] = useState('5');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [quality, setQuality] = useState('pro');
    const [model, setModel] = useState('veo-3');
    const [camera, setCamera] = useState('static');
    const [motionAmount, setMotionAmount] = useState([50]);
    const [isPlaying, setIsPlaying] = useState(false);
    const { isGenerating, videoUrl: generatedVideo, error, createVideo, setVideoUrl: setGeneratedVideo } = useVideoGeneration();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        const url = await createVideo(prompt, {
            negativePrompt: negativePrompt || undefined,
            duration: parseInt(duration),
            aspectRatio,
            cameraMotion: camera,
            motionAmount: motionAmount[0],
        });
        if (url) setIsPlaying(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 mb-4">
                            <Video className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Video Generation</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Text to Video</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Transform your descriptions into cinematic videos with advanced AI
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Video Description</label>
                                <Textarea
                                    placeholder="Describe your video scene in detail...&#10;&#10;Include:&#10;• Subject and actions&#10;• Environment and lighting&#10;• Camera movement&#10;• Style and mood"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[150px] resize-none"
                                />
                            </div>

                            {/* Duration & Aspect */}
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
                                        <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="16:9">16:9 Landscape</SelectItem>
                                                <SelectItem value="9:16">9:16 Portrait</SelectItem>
                                                <SelectItem value="1:1">1:1 Square</SelectItem>
                                                <SelectItem value="21:9">21:9 Cinematic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Quality</label>
                                        <Select value={quality} onValueChange={setQuality}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="std">Standard</SelectItem>
                                                <SelectItem value="pro">Professional</SelectItem>
                                                <SelectItem value="master">Master</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Model</label>
                                        <Select value={model} onValueChange={setModel}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {videoModels.map((m) => (
                                                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Camera Motion */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Camera Movement</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {cameraPresets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => setCamera(preset.id)}
                                            className={`p-2 rounded-lg border text-center transition-all ${camera === preset.id
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="text-lg block">{preset.icon}</span>
                                            <span className="text-xs">{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Motion Amount */}
                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Motion Amount</label>
                                    <span className="text-sm text-muted-foreground">{motionAmount[0]}%</span>
                                </div>
                                <Slider value={motionAmount} onValueChange={setMotionAmount} min={0} max={100} />
                            </div>

                            {/* Negative Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Negative Prompt</label>
                                <Textarea
                                    placeholder="What to avoid..."
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    className="min-h-[60px] resize-none text-sm"
                                />
                            </div>

                            {/* Generate */}
                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full h-14 text-lg gradient-primary"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Generating Video...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5 mr-2" />
                                        Generate Video
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
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Video className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Create Your Video</h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    Describe your scene and let AI bring it to life with stunning motion
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                                    <Video className="absolute inset-0 m-auto w-10 h-10 text-primary" />
                                                </div>
                                                <p className="text-xl font-semibold mb-2">Generating Video</p>
                                                <p className="text-muted-foreground">This may take 30-60 seconds</p>
                                                <div className="mt-4 w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto">
                                                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Video Info */}
                                {generatedVideo && (
                                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{duration}s • {aspectRatio} • {quality.toUpperCase()}</span>
                                        <span>{model}</span>
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

export default TextToVideo;
