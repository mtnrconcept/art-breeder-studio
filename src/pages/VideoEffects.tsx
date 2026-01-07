import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Heart, Wand2, RefreshCw, Download, Plus, X } from 'lucide-react';

const effectTemplates = [
    { id: 'hug', label: 'Hug', emoji: '🤗', single: false },
    { id: 'handshake', label: 'Shake Hands', emoji: '🤝', single: false },
    { id: 'kiss', label: 'Kiss', emoji: '💋', single: false },
    { id: 'wave', label: 'Wave', emoji: '👋', single: true },
    { id: 'dance', label: 'Dance', emoji: '💃', single: true },
    { id: 'laugh', label: 'Laugh', emoji: '😂', single: true },
    { id: 'walk', label: 'Walk Together', emoji: '🚶', single: false },
    { id: 'toast', label: 'Toast', emoji: '🥂', single: false },
];

const VideoEffects = () => {
    const [images, setImages] = useState<string[]>([]);
    const [selectedEffect, setSelectedEffect] = useState('hug');
    const [duration, setDuration] = useState('5');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && images.length < 2) {
            Array.from(files).slice(0, 2 - images.length).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (event) => setImages(prev => [...prev, event.target?.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

    const currentEffect = effectTemplates.find(e => e.id === selectedEffect);
    const minImages = currentEffect?.single ? 1 : 2;

    const handleGenerate = () => {
        if (images.length < minImages) return;
        setIsProcessing(true);
        setTimeout(() => {
            setResult('https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4');
            setIsProcessing(false);
        }, 5000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-500 mb-4">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm font-medium">Interactive Effects</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Video Effects</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Create magical interactions between characters from static images</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">
                                    Upload {currentEffect?.single ? '1' : '2'} Image{currentEffect?.single ? '' : 's'}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {images.length < 2 && (
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                                <div className="text-center"><Plus className="w-8 h-8 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground">Add Image</span></div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Effect Template</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {effectTemplates.map((effect) => (
                                        <button key={effect.id} onClick={() => { setSelectedEffect(effect.id); if (!effect.single && images.length === 1) { } }}
                                            className={`p-2 rounded-lg border text-center transition-all ${selectedEffect === effect.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                            <span className="text-xl block">{effect.emoji}</span>
                                            <span className="text-xs">{effect.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Duration</label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 seconds</SelectItem>
                                        <SelectItem value="5">5 seconds</SelectItem>
                                        <SelectItem value="10">10 seconds</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleGenerate} disabled={images.length < minImages || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Creating Effect...</> : <><Wand2 className="w-5 h-5 mr-2" />Generate Video Effect</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">Result</h3>
                                    {result && <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-2" />Download</Button>}
                                </div>
                                <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-pink-900/20 to-rose-600/20 relative">
                                    {result ? (
                                        <video src={result} className="w-full h-full object-contain" controls autoPlay loop />
                                    ) : images.length >= minImages ? (
                                        <div className="absolute inset-0 flex items-center justify-center gap-4">
                                            {images.map((img, i) => (
                                                <div key={i} className="w-24 h-32 rounded-lg overflow-hidden"><img src={img} className="w-full h-full object-cover" /></div>
                                            ))}
                                            <span className="text-4xl">{currentEffect?.emoji}</span>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Heart className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Video Effects</h3><p className="text-muted-foreground">Upload images to create interactive effects</p></div></div>
                                    )}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-pink-500/20" /><div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Creating {currentEffect?.label} effect...</p></div>
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

export default VideoEffects;
