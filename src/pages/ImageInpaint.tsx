import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Upload, Paintbrush, Eraser, Undo, Redo, Wand2, RefreshCw, Download, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { inpaintImage } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

const ImageInpaint = () => {
    const [image, setImage] = useState<string | null>(null);
    const [maskImage, setMaskImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [brushSize, setBrushSize] = useState([30]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [showMask, setShowMask] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
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

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    }, [tool, brushSize]);

    const handleMouseUp = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        draw(e);
    }, [isDrawing, tool, brushSize]);

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        ctx.beginPath();
        ctx.arc(x * scaleX, y * scaleY, brushSize[0], 0, Math.PI * 2);

        if (tool === 'brush') {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
            ctx.fill();
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const clearMask = () => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Convert mask to black and white format for API
    const getMaskDataUrl = (): string | null => {
        const maskCanvas = maskCanvasRef.current;
        if (!maskCanvas) return null;

        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return null;

        // Create a new canvas for the B&W mask
        const bwCanvas = document.createElement('canvas');
        bwCanvas.width = 800;
        bwCanvas.height = 800;
        const bwCtx = bwCanvas.getContext('2d');
        if (!bwCtx) return null;

        // Fill with black (areas to keep)
        bwCtx.fillStyle = 'black';
        bwCtx.fillRect(0, 0, 800, 800);

        // Get the original mask data
        const maskData = maskCtx.getImageData(0, 0, 800, 800);
        const bwData = bwCtx.getImageData(0, 0, 800, 800);

        // Convert: masked areas become white
        for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i + 3] > 50) { // If pixel has alpha (was painted)
                bwData.data[i] = 255;     // R
                bwData.data[i + 1] = 255; // G
                bwData.data[i + 2] = 255; // B
                bwData.data[i + 3] = 255; // A
            }
        }

        bwCtx.putImageData(bwData, 0, 0);
        return bwCanvas.toDataURL('image/png');
    };

    const handleProcess = async () => {
        if (!image || !prompt.trim()) return;
        setIsProcessing(true);
        setError(null);

        try {
            const maskDataUrl = getMaskDataUrl();
            if (!maskDataUrl) {
                throw new Error('Please draw a mask on the image first');
            }

            const result = await inpaintImage(image, maskDataUrl, prompt);

            if (result.success && result.imageUrl) {
                setResult(result.imageUrl);
                toast({
                    title: "Inpainting Complete!",
                    description: "Your image has been edited successfully",
                });
            } else {
                const errorMsg = result.error || 'Failed to process image';
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-500 mb-4">
                            <Paintbrush className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Inpainting</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Draw to Edit</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Paint over areas you want to change and describe what should replace them
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Controls */}
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

                            {/* Tools */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Drawing Tools</label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={tool === 'brush' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTool('brush')}
                                        className="flex-1"
                                    >
                                        <Paintbrush className="w-4 h-4 mr-2" />
                                        Brush
                                    </Button>
                                    <Button
                                        variant={tool === 'eraser' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTool('eraser')}
                                        className="flex-1"
                                    >
                                        <Eraser className="w-4 h-4 mr-2" />
                                        Eraser
                                    </Button>
                                </div>
                            </div>

                            {/* Brush Size */}
                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Brush Size</label>
                                    <span className="text-sm text-muted-foreground">{brushSize[0]}px</span>
                                </div>
                                <Slider
                                    value={brushSize}
                                    onValueChange={setBrushSize}
                                    min={5}
                                    max={100}
                                    step={5}
                                />
                            </div>

                            {/* Actions */}
                            <div className="tool-card p-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={clearMask}>
                                        <Undo className="w-4 h-4 mr-1" />
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setShowMask(!showMask)}
                                    >
                                        {showMask ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                        Mask
                                    </Button>
                                </div>
                            </div>

                            {/* Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Replacement Prompt</label>
                                <Textarea
                                    placeholder="Describe what should appear in the masked area..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Generate */}
                            <Button
                                onClick={handleProcess}
                                disabled={!image || !prompt.trim() || isProcessing}
                                className="w-full h-12 gradient-primary"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Apply Inpainting
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Canvas Area */}
                        <div className="lg:col-span-2">
                            <div className="tool-card p-4 aspect-square relative">
                                {!image ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">Upload an image to start editing</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={image}
                                            alt="Original"
                                            className="absolute inset-0 w-full h-full object-contain"
                                        />
                                        <canvas
                                            ref={maskCanvasRef}
                                            width={800}
                                            height={800}
                                            className={`absolute inset-0 w-full h-full cursor-crosshair ${!showMask ? 'opacity-0' : ''}`}
                                            onMouseDown={handleMouseDown}
                                            onMouseUp={handleMouseUp}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseUp}
                                        />

                                        {/* Brush Preview */}
                                        <div
                                            className="pointer-events-none absolute rounded-full border-2 border-primary"
                                            style={{
                                                width: brushSize[0] * 2,
                                                height: brushSize[0] * 2,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result */}
                        <div className="tool-card p-4">
                            <h3 className="font-medium mb-4">Result</h3>
                            {result ? (
                                <div className="space-y-4">
                                    <div className="aspect-square rounded-lg overflow-hidden">
                                        <img
                                            src={result}
                                            alt="Result"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <Button variant="outline" className="w-full">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            ) : (
                                <div className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground text-center px-4">
                                        Result will appear here after processing
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ImageInpaint;
