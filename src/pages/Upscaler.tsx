import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, ZoomIn, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Upscaler = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [model, setModel] = useState<'creative' | 'clarity' | 'real-esrgan'>('creative');
  const [scale, setScale] = useState(2);
  const [enhanceFace, setEnhanceFace] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

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

  const upscaleImage = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('upscale-image', {
        body: { imageUrl, model, scale, enhanceFace },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultImage(data.imageUrl);
      toast({ title: 'Image améliorée !', description: `Résolution x${scale}` });
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Upscaler</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Augmentez la résolution de vos images avec l'IA.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div>
              <Label>Image source</Label>
              {imageUrl ? (
                <div className="relative mt-2 inline-block">
                  <img src={imageUrl} alt="Source" className="max-h-80 rounded-xl" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => { setImageUrl(null); setResultImage(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Cliquez pour télécharger</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <Label>Modèle</Label>
              <Select value={model} onValueChange={(v) => setModel(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creative">Creative Upscaler (Artistique)</SelectItem>
                  <SelectItem value="clarity">Clarity Upscaler (Net)</SelectItem>
                  <SelectItem value="real-esrgan">Real-ESRGAN (Photo réaliste)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label>Échelle: x{scale}</Label>
              </div>
              <Slider
                value={[scale]}
                onValueChange={(v) => setScale(v[0])}
                min={2}
                max={4}
                step={1}
              />
            </div>

            {model === 'real-esrgan' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="enhanceFace">Améliorer les visages</Label>
                <Switch
                  id="enhanceFace"
                  checked={enhanceFace}
                  onCheckedChange={setEnhanceFace}
                />
              </div>
            )}

            <Button
              onClick={upscaleImage}
              disabled={isProcessing || !imageUrl}
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
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Améliorer l'image
                </>
              )}
            </Button>

            {resultImage && (
              <div className="mt-8 space-y-4">
                <Label>Résultat (x{scale})</Label>
                <div className="rounded-xl overflow-hidden bg-black/50">
                  <img src={resultImage} alt="Result" className="w-full" />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={resultImage} download="upscaled.png" target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger HD
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

export default Upscaler;