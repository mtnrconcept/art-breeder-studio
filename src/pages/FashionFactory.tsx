import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Camera, Wand2, RefreshCw, Download, Plus, X } from 'lucide-react';

const poses = [
    { id: 'standing', label: 'Standing' },
    { id: 'sitting', label: 'Sitting' },
    { id: 'walking', label: 'Walking' },
    { id: 'dynamic', label: 'Dynamic' },
];

const settings = [
    { id: 'studio', label: 'Studio White' },
    { id: 'outdoor', label: 'Outdoor' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'custom', label: 'Custom' },
];

const FashionFactory = () => {
    const [productImage, setProductImage] = useState<string | null>(null);
    const [modelImages, setModelImages] = useState<string[]>([]);
    const [pose, setPose] = useState('standing');
    const [setting, setSetting] = useState('studio');
    const [customSetting, setCustomSetting] = useState('');
    const [numVariations, setNumVariations] = useState('4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setProductImage(event.target?.result as string); setResults([]); };
            reader.readAsDataURL(file);
        }
    };

    const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && modelImages.length < 4) {
            Array.from(files).slice(0, 4 - modelImages.length).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (event) => setModelImages(prev => [...prev, event.target?.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeModel = (index: number) => setModelImages(prev => prev.filter((_, i) => i !== index));

    const handleGenerate = () => {
        if (!productImage) return;
        setIsProcessing(true);
        setTimeout(() => {
            setResults([
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
                'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop',
                'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop',
                'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop',
            ]);
            setIsProcessing(false);
        }, 4000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 text-fuchsia-500 mb-4">
                            <Camera className="w-4 h-4" />
                            <span className="text-sm font-medium">Product Photography</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Fashion Factory</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Generate professional product shots with AI models in any setting</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Product Image</label>
                                <label className="block cursor-pointer">
                                    <input type="file" accept="image/*" onChange={handleProductUpload} className="hidden" />
                                    {productImage ? (
                                        <div className="aspect-square rounded-lg overflow-hidden bg-white"><img src={productImage} className="w-full h-full object-contain" /></div>
                                    ) : (
                                        <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload product</span></div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Model References (optional)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {modelImages.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button onClick={() => removeModel(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    {modelImages.length < 4 && (
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" multiple onChange={handleModelUpload} className="hidden" />
                                            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors"><Plus className="w-6 h-6 text-muted-foreground" /></div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="tool-card p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pose</label>
                                    <Select value={pose} onValueChange={setPose}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{poses.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Setting</label>
                                    <Select value={setting} onValueChange={setSetting}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{settings.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                {setting === 'custom' && (
                                    <Textarea placeholder="Describe the setting..." value={customSetting} onChange={(e) => setCustomSetting(e.target.value)} className="min-h-[60px] resize-none" />
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Variations</label>
                                    <Select value={numVariations} onValueChange={setNumVariations}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 images</SelectItem>
                                            <SelectItem value="4">4 images</SelectItem>
                                            <SelectItem value="8">8 images</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button onClick={handleGenerate} disabled={!productImage || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Wand2 className="w-5 h-5 mr-2" />Generate Product Shots</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <h3 className="font-medium mb-4">Generated Product Shots</h3>
                                {results.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {results.map((img, i) => (
                                            <div key={i} className="relative group aspect-[4/5] rounded-lg overflow-hidden">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button size="sm" variant="secondary"><Download className="w-4 h-4 mr-1" />Download</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-xl bg-gradient-to-br from-fuchsia-900/20 to-pink-600/20 flex items-center justify-center">
                                        <div className="text-center"><Camera className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Fashion Factory</h3><p className="text-muted-foreground">Product shots will appear here</p></div>
                                    </div>
                                )}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                        <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-fuchsia-500/20" /><div className="absolute inset-0 rounded-full border-4 border-fuchsia-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Creating product shots...</p></div>
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

export default FashionFactory;
