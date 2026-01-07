import { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Paintbrush, Upload, X, Undo } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Inpainter = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  useEffect(() => {
    if (imageUrl && canvasRef.current && maskCanvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const maskCanvas = maskCanvasRef.current!;
        const container = containerRef.current!;
        
        const maxWidth = container.clientWidth;
        const scale = Math.min(maxWidth / img.width, 1);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        maskCanvas.width = img.width * scale;
        maskCanvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const maskCtx = maskCanvas.getContext('2d')!;
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw on visible canvas
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw on mask canvas
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();
  };

  const clearMask = () => {
    if (!maskCanvasRef.current || !canvasRef.current || !imageUrl) return;
    
    const maskCtx = maskCanvasRef.current.getContext('2d')!;
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
    };
    img.src = imageUrl;
  };

  const inpaint = async () => {
    if (!imageUrl || !maskCanvasRef.current || !prompt.trim()) {
      toast({ title: 'Champs requis', description: 'Image, masque et prompt sont requis', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const maskUrl = maskCanvasRef.current.toDataURL('image/png');
      
      const { data, error } = await supabase.functions.invoke('inpaint', {
        body: { imageUrl, maskUrl, prompt },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultImage(data.imageUrl);
      toast({ title: 'Image modifiée !', description: 'L\'inpainting est terminé.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de traitement', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-6">
              <Paintbrush className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Inpainter</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Peignez sur une zone et décrivez ce que vous voulez y voir apparaître.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            {!imageUrl ? (
              <div>
                <Label>Image source</Label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Cliquez pour télécharger</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <Label>Peignez la zone à modifier</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearMask}>
                      <Undo className="w-4 h-4 mr-1" />
                      Effacer
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setImageUrl(null); setResultImage(null); }}>
                      <X className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
                
                <div ref={containerRef} className="relative">
                  <canvas
                    ref={canvasRef}
                    className="rounded-xl cursor-crosshair border border-border"
                    onMouseDown={() => setIsDrawing(true)}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onMouseMove={draw}
                  />
                  <canvas ref={maskCanvasRef} className="hidden" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Taille du pinceau: {brushSize}px</Label>
                  </div>
                  <Slider
                    value={[brushSize]}
                    onValueChange={(v) => setBrushSize(v[0])}
                    min={5}
                    max={100}
                    step={5}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="prompt">Description du remplacement</Label>
              <Textarea
                id="prompt"
                placeholder="Ex: Un chat assis sur l'herbe, une fleur rouge..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button
              onClick={inpaint}
              disabled={isProcessing || !imageUrl || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Paintbrush className="w-4 h-4 mr-2" />
                  Appliquer l'inpainting
                </>
              )}
            </Button>

            {resultImage && (
              <div className="mt-8 space-y-4">
                <Label>Résultat</Label>
                <div className="rounded-xl overflow-hidden bg-black/50">
                  <img src={resultImage} alt="Result" className="w-full" />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={resultImage} download="inpainted.png" target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inpainter;