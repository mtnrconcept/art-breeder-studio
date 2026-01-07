import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Upload, ImageIcon, Wand2, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { generateVideo } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

const backdropPresets = [
    { id: 'beach', label: 'Beach', emoji: '🏖️' },
    { id: 'forest', label: 'Forest', emoji: '🌲' },
    { id: 'city', label: 'City', emoji: '🌆' },
    { id: 'space', label: 'Space', emoji: '🌌' },
    { id: 'studio', label: 'Studio', emoji: '📸' },
    { id: 'office', label: 'Office', emoji: '🏢' },
    { id: 'mountains', label: 'Mountains', emoji: '⛰️' },
    { id: 'underwater', label: 'Underwater', emoji: '🐠' },
];

const ChangeBackdrop = () => {
    const [video, setVideo] = useState<string | null>(null);
    const [backdropImage, setBackdropImage] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [edgeBlur, setEdgeBlur] = useState([20]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setVideo(URL.createObjectURL(file)); setResult(null); }
    };

    const handleBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setBackdropImage(event.target?.result as string); setSelectedPreset(null); };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = async () => {
        if (!video) return;
        setIsProcessing(true);
        setError(null);

        try {
            const backdropDesc = selectedPreset ? backdropPresets.find(p => p.id === selectedPreset)?.label : "";
            const fullPrompt = `Change the background of this video to ${backdropDesc || prompt || 'a new scene'}. Ensure seamless person/subject isolation and natural lighting matching.`;

            // Note: Veo 3 Video-to-Video isn't explicitly in the current SDK but we'll use generateVideo 
            // with the source video as 'imageUrl' which the backend can handle as a reference media.
            const res = await generateVideo(fullPrompt, {
                imageUrl: video, // Using source video as reference
            });

            if (res.success && res.videoUrl) {
                setResult(res.videoUrl);
                toast({
                    title: "Backdrop Changed!",
                    description: "Your video has been transformed.",
                });
            } else {
                const errorMsg = res.error || 'Failed to change backdrop';
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-500 mb-4">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Background Replacement</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Change Backdrop</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Transform the background in any video instantly</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Source Video</label>
                                <label className="block cursor-pointer">
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                    {video ? (
                                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                            <video src={video} className="w-full h-full object-contain" muted />
                                        </div>
                                    ) : (
                                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload video</span></div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Backdrop Presets</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {backdropPresets.map((preset) => (
                                        <button key={preset.id} onClick={() => { setSelectedPreset(preset.id); setBackdropImage(null); }}
                                            className={`p-2 rounded-lg border text-center transition-all ${selectedPreset === preset.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                            <span className="text-xl block">{preset.emoji}</span>
                                            <span className="text-xs">{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Or Upload Custom</label>
                                <label className="block cursor-pointer">
                                    <input type="file" accept="image/*" onChange={handleBackdropUpload} className="hidden" />
                                    <div className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors text-center">
                                        <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Upload backdrop image</span>
                                    </div>
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Or Describe</label>
                                <Textarea placeholder="e.g., A futuristic neon city at night..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[60px] resize-none" />
                            </div>

                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Edge Blur</label>
                                    <span className="text-sm text-muted-foreground">{edgeBlur[0]}%</span>
                                </div>
                                <Slider value={edgeBlur} onValueChange={setEdgeBlur} min={0} max={100} />
                            </div>

                            <Button onClick={handleProcess} disabled={!video || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Wand2 className="w-5 h-5 mr-2" />Change Backdrop</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? <video src={result} className="w-full h-full object-contain" controls autoPlay loop />
                                        : video ? <video src={video} className="w-full h-full object-contain" controls />
                                            : <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><ImageIcon className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Upload a Video</h3></div></div>}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-teal-500/20" /><div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Changing backdrop...</p></div>
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

export default ChangeBackdrop;
