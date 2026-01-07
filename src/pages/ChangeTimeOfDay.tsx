import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Sun, Wand2, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { generateVideo } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

const timePresets = [
    { id: 'sunrise', label: 'Sunrise', emoji: '🌅', color: 'from-orange-400 to-pink-500' },
    { id: 'morning', label: 'Morning', emoji: '🌄', color: 'from-yellow-300 to-blue-400' },
    { id: 'noon', label: 'Noon', emoji: '☀️', color: 'from-yellow-200 to-blue-500' },
    { id: 'golden', label: 'Golden Hour', emoji: '🌇', color: 'from-amber-400 to-orange-500' },
    { id: 'sunset', label: 'Sunset', emoji: '🌆', color: 'from-orange-500 to-purple-600' },
    { id: 'dusk', label: 'Dusk', emoji: '🌃', color: 'from-purple-500 to-indigo-700' },
    { id: 'night', label: 'Night', emoji: '🌙', color: 'from-indigo-800 to-slate-900' },
    { id: 'midnight', label: 'Midnight', emoji: '🌌', color: 'from-slate-900 to-black' },
];

const ChangeTimeOfDay = () => {
    const [video, setVideo] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState('golden');
    const [intensity, setIntensity] = useState([70]);
    const [atmosphereHaze, setAtmosphereHaze] = useState([30]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setVideo(URL.createObjectURL(file)); setResult(null); }
    };

    const handleProcess = async () => {
        if (!video) return;
        setIsProcessing(true);
        setError(null);

        try {
            const timeDesc = timePresets.find(p => p.id === selectedTime)?.label || selectedTime;
            const fullPrompt = `Change the time of day in this video to ${timeDesc}. Adjust lighting, shadows, and atmosphere color accordingly. Intensity: ${intensity[0]}%. Haze: ${atmosphereHaze[0]}%.`;

            const res = await generateVideo(fullPrompt, {
                imageUrl: video,
            });

            if (res.success && res.videoUrl) {
                setResult(res.videoUrl);
                toast({
                    title: "Time Changed!",
                    description: `Lighting shifted to ${timeDesc}`,
                });
            } else {
                const errorMsg = res.error || 'Failed to change time of day';
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

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 mb-4">
                            <Sun className="w-4 h-4" />
                            <span className="text-sm font-medium">Time Manipulation</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Change Time of Day</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Transform lighting from dawn to dusk instantly</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block cursor-pointer">
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                    {video ? (
                                        <div className="aspect-video rounded-lg overflow-hidden bg-black"><video src={video} className="w-full h-full object-contain" muted /></div>
                                    ) : (
                                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload video</span></div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Target Time</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {timePresets.map((preset) => (
                                        <button key={preset.id} onClick={() => setSelectedTime(preset.id)}
                                            className={`p-2 rounded-lg border text-center transition-all ${selectedTime === preset.id ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-primary/50'}`}>
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${preset.color} mx-auto mb-1`} />
                                            <span className="text-xs">{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="tool-card p-4 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium">Effect Intensity</label>
                                        <span className="text-sm text-muted-foreground">{intensity[0]}%</span>
                                    </div>
                                    <Slider value={intensity} onValueChange={setIntensity} min={0} max={100} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium">Atmosphere Haze</label>
                                        <span className="text-sm text-muted-foreground">{atmosphereHaze[0]}%</span>
                                    </div>
                                    <Slider value={atmosphereHaze} onValueChange={setAtmosphereHaze} min={0} max={100} />
                                </div>
                            </div>

                            <Button onClick={handleProcess} disabled={!video || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Sun className="w-5 h-5 mr-2" />Apply Time Change</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? <video src={result} className="w-full h-full object-contain" controls autoPlay loop />
                                        : video ? <video src={video} className="w-full h-full object-contain" controls />
                                            : <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Sun className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Upload a Video</h3></div></div>}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-amber-500/20" /><div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Changing time...</p></div>
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

export default ChangeTimeOfDay;
