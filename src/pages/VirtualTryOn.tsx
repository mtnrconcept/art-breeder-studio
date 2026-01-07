import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Shirt, Wand2, RefreshCw, Download, ArrowRight } from 'lucide-react';

const clothingCategories = [
    { id: 'top', label: 'Top (Shirts, Jackets)' },
    { id: 'bottom', label: 'Bottom (Pants, Skirts)' },
    { id: 'dress', label: 'Full Dress' },
    { id: 'outfit', label: 'Complete Outfit' },
];

const VirtualTryOn = () => {
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [clothingImage, setClothingImage] = useState<string | null>(null);
    const [category, setCategory] = useState('top');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setModelImage(event.target?.result as string); setResult(null); };
            reader.readAsDataURL(file);
        }
    };

    const handleClothingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setClothingImage(event.target?.result as string); setResult(null); };
            reader.readAsDataURL(file);
        }
    };

    const handleTryOn = () => {
        if (!modelImage || !clothingImage) return;
        setIsProcessing(true);
        setTimeout(() => {
            setResult('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop');
            setIsProcessing(false);
        }, 4000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-500 mb-4">
                            <Shirt className="w-4 h-4" />
                            <span className="text-sm font-medium">Fashion AI</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Virtual Try-On</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">See how any clothing looks on any model instantly</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Model Upload */}
                                <div className="tool-card p-4">
                                    <label className="block text-sm font-medium mb-3">Model Photo</label>
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleModelUpload} className="hidden" />
                                        {modelImage ? (
                                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black">
                                                <img src={modelImage} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                                <div className="text-center p-4"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload model photo</span></div>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {/* Clothing Upload */}
                                <div className="tool-card p-4">
                                    <label className="block text-sm font-medium mb-3">Clothing Item</label>
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleClothingUpload} className="hidden" />
                                        {clothingImage ? (
                                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white">
                                                <img src={clothingImage} className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                                <div className="text-center p-4"><Shirt className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload clothing</span></div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Clothing Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {clothingCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleTryOn} disabled={!modelImage || !clothingImage || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Wand2 className="w-5 h-5 mr-2" />Try On Clothing</>}
                            </Button>
                        </div>

                        <div className="tool-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium">Result</h3>
                                {result && <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-2" />Download</Button>}
                            </div>
                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-rose-900/20 to-pink-600/20 relative">
                                {result ? (
                                    <img src={result} className="w-full h-full object-cover" />
                                ) : modelImage && clothingImage ? (
                                    <div className="absolute inset-0 flex items-center justify-center gap-4 p-4">
                                        <div className="w-24 h-32 rounded-lg overflow-hidden"><img src={modelImage} className="w-full h-full object-cover" /></div>
                                        <ArrowRight className="w-6 h-6 text-muted-foreground" />
                                        <div className="w-20 h-24 rounded-lg overflow-hidden bg-white"><img src={clothingImage} className="w-full h-full object-contain" /></div>
                                        <ArrowRight className="w-6 h-6 text-muted-foreground" />
                                        <div className="w-24 h-32 rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center"><span className="text-xs text-muted-foreground">Result</span></div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Shirt className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Virtual Try-On</h3><p className="text-muted-foreground">Upload a model and clothing to see the result</p></div></div>
                                )}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                        <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-rose-500/20" /><div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Fitting clothing...</p></div>
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

export default VirtualTryOn;
