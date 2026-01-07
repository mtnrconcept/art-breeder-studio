import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Eraser, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BackgroundRemover = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [model, setModel] = useState<'birefnet' | 'rembg'>('birefnet');
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

  const removeBackground = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl, model },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultImage(data.imageUrl);
      toast({ title: 'Fond supprimé !', description: 'L\'image est prête.' });
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Eraser className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Remove Background</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Supprimez automatiquement le fond de vos images en un clic.
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
                  <SelectItem value="birefnet">BiRefNet (Haute qualité)</SelectItem>
                  <SelectItem value="rembg">RemBG (Rapide)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={removeBackground}
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
                  <Eraser className="w-4 h-4 mr-2" />
                  Supprimer le fond
                </>
              )}
            </Button>

            {resultImage && (
              <div className="mt-8 space-y-4">
                <Label>Résultat</Label>
                <div className="rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')]">
                  <img src={resultImage} alt="Result" className="w-full" />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={resultImage} download="no-background.png" target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PNG
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

export default BackgroundRemover;