import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Lightbulb, Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import { generateImage, generateVideo } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

const RelightScene = () => {
    const [media, setMedia] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [lightX, setLightX] = useState(50);
    const [lightY, setLightY] = useState(30);
    const [lightIntensity, setLightIntensity] = useState([70]);
    const [lightColor, setLightColor] = useState('#ffffff');
    const [shadowSoftness, setShadowSoftness] = useState([50]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video');
            setMediaType(isVideo ? 'video' : 'image');
            if (isVideo) {
                setMedia(URL.createObjectURL(file));
            } else {
                const reader = new FileReader();
                reader.onload = (event) => setMedia(event.target?.result as string);
                reader.readAsDataURL(file);
            }
            setResult(null);
        }
    };

    const handleSphereClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setLightX(Math.round(x));
        setLightY(Math.round(y));
    };

    const handleProcess = async () => {
        if (!media) return;
        setIsProcessing(true);
        setError(null);

        try {
            const relightPrompt = `Relight this ${mediaType}. Position a new light source at ${lightX}% horizontal, ${lightY}% vertical. Color: ${lightColor}. Intensity: ${lightIntensity[0]}%. Shadow softness: ${shadowSoftness[0]}%. Ensure realistic interaction with surfaces and shadows.`;

            let res;
            if (mediaType === 'image') {
                res = await generateImage({
                    prompt: relightPrompt,
                    baseImageUrl: media,
                    type: 'tune',
                });
            } else {
                res = await generateVideo(relightPrompt, {
                    imageUrl: media,
                });
            }

            if (res.success && (res.imageUrl || res.videoUrl)) {
                setResult(res.imageUrl || res.videoUrl || null);
                toast({
                    title: "Relight Successful!",
                    description: `The ${mediaType} has been relit as requested.`,
                });
            } else {
                const errorMsg = res.error || `Failed to relight ${mediaType}`;
                setError(errorMsg);
                toast({
                    title: "Process Failed",
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
            setIsProcessing(false);
        }
    };

    const lightColors = ['#ffffff', '#fff5e6', '#ffe4c4', '#add8e6', '#90ee90', '#ffb6c1', '#dda0dd'];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-500 mb-4">
                            <Lightbulb className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Relighting</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Relight Scene</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Change lighting direction, color, and intensity in any video or image</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block cursor-pointer">
                                    <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                                    {media ? (
                                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                            {mediaType === 'video' ? <video src={media} className="w-full h-full object-contain" muted /> : <img src={media} className="w-full h-full object-contain" />}
                                        </div>
                                    ) : (
                                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload image or video</span></div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Light Position</label>
                                <div className="relative w-full aspect-square rounded-full bg-gradient-to-br from-slate-700 to-slate-900 cursor-crosshair overflow-hidden" onClick={handleSphereClick}>
                                    <div className="absolute w-6 h-6 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50 -translate-x-1/2 -translate-y-1/2 transition-all" style={{ left: `${lightX}%`, top: `${lightY}%` }} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30" />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground text-center mt-2">Click to position light source</p>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Light Color</label>
                                <div className="flex gap-2">
                                    {lightColors.map((color) => (
                                        <button key={color} onClick={() => setLightColor(color)} style={{ backgroundColor: color }}
                                            className={`w-8 h-8 rounded-full border-2 ${lightColor === color ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="tool-card p-4 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium">Intensity</label>
                                        <span className="text-sm text-muted-foreground">{lightIntensity[0]}%</span>
                                    </div>
                                    <Slider value={lightIntensity} onValueChange={setLightIntensity} min={0} max={100} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium">Shadow Softness</label>
                                        <span className="text-sm text-muted-foreground">{shadowSoftness[0]}%</span>
                                    </div>
                                    <Slider value={shadowSoftness} onValueChange={setShadowSoftness} min={0} max={100} />
                                </div>
                            </div>

                            <Button onClick={handleProcess} disabled={!media || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Lightbulb className="w-5 h-5 mr-2" />Apply Relighting</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? (
                                        mediaType === 'video' ? <video src={result} className="w-full h-full object-contain" controls autoPlay loop /> : <img src={result} className="w-full h-full object-contain" />
                                    ) : media ? (
                                        mediaType === 'video' ? <video src={media} className="w-full h-full object-contain" controls /> : <img src={media} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Lightbulb className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Upload Media</h3></div></div>
                                    )}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-yellow-500/20" /><div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Relighting scene...</p></div>
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

export default RelightScene;
