import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Palette, Wand2, RefreshCw, Download, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { styleTransfer } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';
import { AspectRatioSelector, AspectRatio } from '@/components/shared/AspectRatioSelector';
import { getImageDimensions } from '@/lib/utils';

const stylePresets = [
    { id: 'van-gogh', label: 'Van Gogh', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=512&h=512&fit=crop' },
    { id: 'monet', label: 'Monet', image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=512&h=512&fit=crop' },
    { id: 'picasso', label: 'Picasso', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=512&h=512&fit=crop' },
    { id: 'anime', label: 'Anime', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=512&h=512&fit=crop' },
    { id: 'sketch', label: 'Pencil Sketch', image: 'https://images.unsplash.com/photo-1502355984-b735cb2550ce?w=512&h=512&fit=crop' },
    { id: 'watercolor', label: 'Watercolor', image: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=512&h=512&fit=crop' },
    { id: 'pop-art', label: 'Pop Art', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=512&h=512&fit=crop' },
    { id: 'cyberpunk', label: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=512&h=512&fit=crop' },
    { id: 'oil-painting', label: 'Oil Painting', image: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=512&h=512&fit=crop' },
    { id: 'digital-art', label: 'Digital Art', image: 'https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=512&h=512&fit=crop' },
    { id: 'vintage', label: 'Vintage Film', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=512&h=512&fit=crop' },
    { id: 'neon', label: 'Neon Glow', image: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=512&h=512&fit=crop' },
];

const StyleTransfer = () => {
    const [contentImage, setContentImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [styleStrength, setStyleStrength] = useState([70]);
    const [colorPreservation, setColorPreservation] = useState([30]);
    const [result, setResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [detectedDimensions, setDetectedDimensions] = useState<{ width: number, height: number } | undefined>();
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const b64 = event.target?.result as string;
                setContentImage(b64);
                setResult(null);
                try {
                    const dims = await getImageDimensions(b64);
                    setDetectedDimensions(dims);
                    if (dims.width > dims.height) setAspectRatio('4:3');
                    else if (dims.height > dims.width) setAspectRatio('3:4');
                    else setAspectRatio('1:1');
                } catch (e) {
                    console.error("Dim detection failed", e);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setStyleImage(event.target?.result as string);
                setSelectedPreset(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePresetSelect = (presetId: string) => {
        setSelectedPreset(presetId);
        setStyleImage(null);
        const preset = stylePresets.find(p => p.id === presetId);
        if (preset) {
            setStyleImage(preset.image);
        }
    };

    const handleTransfer = async () => {
        if (!contentImage || (!styleImage && !selectedPreset)) return;
        setIsProcessing(true);
        setError(null);

        try {
            const targetStyle = styleImage || (selectedPreset ? stylePresets.find(p => p.id === selectedPreset)?.image : null);
            if (!targetStyle) throw new Error("No style selected");

            const presetName = selectedPreset ? stylePresets.find(p => p.id === selectedPreset)?.label : "this artistic reference";
            const prompt = `Stylize the image using the artistic style of ${presetName}, preserving the content and structure.`;

            const res = await styleTransfer(contentImage, targetStyle, prompt, styleStrength[0]);

            if (res.success && res.imageUrl) {
                setResult(res.imageUrl);
                toast({
                    title: "Style Applied!",
                    description: "Your artistic transformation is complete",
                });
            } else {
                const errorMsg = res.error || 'Failed to apply style';
                setError(errorMsg);
                toast({
                    title: "Processing Failed",
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
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-500 mb-4">
                            <Palette className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Style Transfer</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Style Transfer</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Transform your images with artistic styles from famous painters to modern aesthetics
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left - Content & Style Selection */}
                        <div className="space-y-4">
                            {/* Content Image */}
                            <div className="tool-card p-4">
                                <h3 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">1</span>
                                    Content Image
                                </h3>
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleContentUpload}
                                        className="hidden"
                                    />
                                    {contentImage ? (
                                        <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group">
                                            <img src={contentImage} alt="Content" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-sm">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                            <div className="text-center">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Upload your image</span>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Style Selection */}
                            <div className="tool-card p-4">
                                <h3 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">2</span>
                                    Choose Style
                                </h3>

                                {/* Tabs */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setActiveTab('presets')}
                                        className={`flex-1 py-2 text-sm rounded-lg transition-colors ${activeTab === 'presets' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                                            }`}
                                    >
                                        Style Presets
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('custom')}
                                        className={`flex-1 py-2 text-sm rounded-lg transition-colors ${activeTab === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                                            }`}
                                    >
                                        Custom Style
                                    </button>
                                </div>

                                {activeTab === 'presets' ? (
                                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                                        {stylePresets.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => handlePresetSelect(preset.id)}
                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPreset === preset.id
                                                    ? 'border-primary ring-2 ring-primary/50'
                                                    : 'border-transparent hover:border-primary/50'
                                                    }`}
                                            >
                                                <img src={preset.image} alt={preset.label} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1">
                                                    <span className="text-white text-xs font-medium truncate">{preset.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <label className="block">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleStyleUpload}
                                            className="hidden"
                                        />
                                        {styleImage && !selectedPreset ? (
                                            <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group">
                                                <img src={styleImage} alt="Style" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-sm">Change Style</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                                <div className="text-center">
                                                    <Palette className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">Upload style reference</span>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            <div className="tool-card p-4">
                                <AspectRatioSelector
                                    value={aspectRatio}
                                    onChange={setAspectRatio}
                                    customDimensions={detectedDimensions}
                                />
                            </div>

                            {/* Settings */}
                            <div className="tool-card p-4 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Style Strength</span>
                                        <span className="text-sm text-muted-foreground">{styleStrength[0]}%</span>
                                    </div>
                                    <Slider value={styleStrength} onValueChange={setStyleStrength} min={0} max={100} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Color Preservation</span>
                                        <span className="text-sm text-muted-foreground">{colorPreservation[0]}%</span>
                                    </div>
                                    <Slider value={colorPreservation} onValueChange={setColorPreservation} min={0} max={100} />
                                </div>
                            </div>

                            {/* Transfer Button */}
                            <Button
                                onClick={handleTransfer}
                                disabled={!contentImage || (!styleImage && !selectedPreset) || isProcessing}
                                className="w-full h-12 gradient-primary"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Transferring Style...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Apply Style Transfer
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Right - Result */}
                        <div className="lg:col-span-2">
                            <div className="tool-card p-6 min-h-[600px]">
                                {result ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">Stylized Result</h3>
                                            <Button variant="outline" size="sm">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>

                                        {/* Before/After */}
                                        <div className="grid grid-cols-3 gap-4 items-center">
                                            <div className="aspect-square rounded-lg overflow-hidden">
                                                <img src={contentImage!} alt="Original" className="w-full h-full object-cover" />
                                                <p className="text-center text-xs text-muted-foreground mt-2">Original</p>
                                            </div>
                                            <div className="flex justify-center">
                                                <ArrowRight className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="aspect-square rounded-lg overflow-hidden">
                                                <img src={styleImage!} alt="Style" className="w-full h-full object-cover" />
                                                <p className="text-center text-xs text-muted-foreground mt-2">Style</p>
                                            </div>
                                        </div>

                                        <div className="aspect-video rounded-lg overflow-hidden">
                                            <img src={result} alt="Result" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">Ready to Transform</h3>
                                            <p className="text-muted-foreground max-w-md">
                                                Upload a content image and select a style to see your artistic transformation
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                        <div className="text-center">
                                            <div className="relative w-20 h-20 mx-auto mb-4">
                                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                            </div>
                                            <p className="text-lg font-medium">Applying artistic style...</p>
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

export default StyleTransfer;
