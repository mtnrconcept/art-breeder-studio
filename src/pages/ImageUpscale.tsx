import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, ZoomIn, RefreshCw, Download, ArrowLeftRight, Sparkles, Image, AlertCircle } from 'lucide-react';
import { generateImage } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

const upscaleModels = [
    { id: 'imagen-4-ultra', label: 'Imagen 4 Ultra', description: 'Google\'s best model' },
    { id: 'real-esrgan', label: 'Real-ESRGAN', description: 'Best for photos' },
    { id: 'topaz-photo', label: 'Topaz Photo AI', description: 'Detail enhancement' },
    { id: ' gigapixel', label: 'Gigapixel AI', description: 'Maximum resolution' },
];

const ImageUpscale = () => {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [scaleFactor, setScaleFactor] = useState('2');
    const [model, setModel] = useState('imagen-4-ultra');
    const [denoise, setDenoise] = useState([20]);
    const [sharpness, setSharpness] = useState([50]);
    const [enhanceDetails, setEnhanceDetails] = useState(true);
    const [denoiseEnabled, setDenoiseEnabled] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [comparePosition, setComparePosition] = useState(50);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpscale = async () => {
        if (!image) return;
        setIsProcessing(true);
        setError(null);

        try {
            const prompt = `Upscale this image to ${scaleFactor}x resolution. Enhance details, remove noise, and improve sharpness while maintaining the original content and style accurately.`;
            const res = await generateImage({
                prompt,
                baseImageUrl: image,
                type: 'tune', // Using tune for image-to-image enhancement
            });

            if (res.success && res.imageUrl) {
                setResult(res.imageUrl);
                toast({
                    title: "Upscale Complete!",
                    description: `Image successfully enhanced by ${scaleFactor}x`,
                });
            } else {
                const errorMsg = res.error || 'Failed to upscale image';
                setError(errorMsg);
                toast({
                    title: "Upscale Failed",
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                            <ZoomIn className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Enhancement</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Image Upscale</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Enhance resolution up to 8K with AI-powered detail recovery
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Upload */}
                            <div className="tool-card p-4">
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                                        <Upload className="w-5 h-5" />
                                        <span>{image ? 'Change Image' : 'Upload Image'}</span>
                                    </div>
                                </label>
                            </div>

                            {/* Scale Factor */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Scale Factor</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['2', '4', '8'].map((factor) => (
                                        <button
                                            key={factor}
                                            onClick={() => setScaleFactor(factor)}
                                            className={`p-3 rounded-lg border text-center font-semibold transition-all ${scaleFactor === factor
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {factor}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Model */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Upscale Model</label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {upscaleModels.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <div>
                                                    <span>{m.label}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">({m.description})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Enhancement Options */}
                            <div className="tool-card p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Enhance Details</label>
                                    <Switch checked={enhanceDetails} onCheckedChange={setEnhanceDetails} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Denoise</label>
                                    <Switch checked={denoiseEnabled} onCheckedChange={setDenoiseEnabled} />
                                </div>

                                {denoiseEnabled && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-muted-foreground">Denoise Strength</span>
                                            <span className="text-xs text-muted-foreground">{denoise[0]}%</span>
                                        </div>
                                        <Slider value={denoise} onValueChange={setDenoise} min={0} max={100} />
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Sharpness</span>
                                        <span className="text-xs text-muted-foreground">{sharpness[0]}%</span>
                                    </div>
                                    <Slider value={sharpness} onValueChange={setSharpness} min={0} max={100} />
                                </div>
                            </div>

                            {/* Process Button */}
                            <Button
                                onClick={handleUpscale}
                                disabled={!image || isProcessing}
                                className="w-full h-12 gradient-primary"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Upscaling...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Upscale Image
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Preview Area */}
                        <div className="lg:col-span-3">
                            <div className="tool-card p-4">
                                {/* Compare Toggle */}
                                {result && (
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <ArrowLeftRight className="w-4 h-4" />
                                            <span className="text-sm font-medium">Compare Mode</span>
                                            <Switch checked={compareMode} onCheckedChange={setCompareMode} />
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download {scaleFactor}x
                                        </Button>
                                    </div>
                                )}

                                {/* Image Display */}
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30">
                                    {!image ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">Upload an image to enhance</p>
                                            </div>
                                        </div>
                                    ) : compareMode && result ? (
                                        /* Comparison Slider */
                                        <div className="relative w-full h-full">
                                            <img
                                                src={result}
                                                alt="Upscaled"
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                            <div
                                                className="absolute inset-y-0 left-0 overflow-hidden"
                                                style={{ width: `${comparePosition}%` }}
                                            >
                                                <img
                                                    src={image}
                                                    alt="Original"
                                                    className="absolute inset-0 w-full h-full object-contain"
                                                    style={{ width: `${100 / (comparePosition / 100)}%`, maxWidth: 'none' }}
                                                />
                                            </div>
                                            <div
                                                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize"
                                                style={{ left: `${comparePosition}%` }}
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={comparePosition}
                                                onChange={(e) => setComparePosition(Number(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                                            />
                                            <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 rounded text-white text-xs">
                                                Original
                                            </div>
                                            <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/50 rounded text-white text-xs">
                                                {scaleFactor}x Upscaled
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={result || image}
                                            alt={result ? 'Upscaled' : 'Original'}
                                            className="w-full h-full object-contain"
                                        />
                                    )}

                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-20 h-20 mx-auto mb-4">
                                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-lg font-medium">Enhancing image...</p>
                                                <p className="text-sm text-muted-foreground">Upscaling to {scaleFactor}x resolution</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                {image && (
                                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Original: 512 × 512 px</span>
                                        {result && <span>Upscaled: {512 * Number(scaleFactor)} × {512 * Number(scaleFactor)} px</span>}
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

export default ImageUpscale;
