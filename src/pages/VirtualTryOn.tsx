import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Shirt, Upload, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VirtualTryOn = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [category, setCategory] = useState<'upper_body' | 'lower_body' | 'dresses'>('upper_body');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handlePersonUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPersonImage(e.target?.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGarmentUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGarmentImage(e.target?.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const tryOn = async () => {
    if (!personImage || !garmentImage) {
      toast({ title: 'Images requises', description: 'Veuillez télécharger les deux images', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          personImageUrl: personImage,
          garmentImageUrl: garmentImage,
          category,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultImage(data.imageUrl);
      toast({ title: 'Essayage terminé !', description: 'Le vêtement a été appliqué.' });
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
              <Shirt className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Virtual Try-On</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Essayez virtuellement des vêtements sur une photo.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Person Image */}
              <div>
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Photo de la personne
                </Label>
                {personImage ? (
                  <div className="relative mt-2">
                    <img src={personImage} alt="Person" className="w-full max-h-64 object-contain rounded-xl" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => { setPersonImage(null); setResultImage(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <User className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Photo en pied</span>
                    <input type="file" accept="image/*" onChange={handlePersonUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Garment Image */}
              <div>
                <Label className="flex items-center gap-2">
                  <Shirt className="w-4 h-4" />
                  Photo du vêtement
                </Label>
                {garmentImage ? (
                  <div className="relative mt-2">
                    <img src={garmentImage} alt="Garment" className="w-full max-h-64 object-contain rounded-xl" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => { setGarmentImage(null); setResultImage(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Shirt className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Photo du vêtement</span>
                    <input type="file" accept="image/*" onChange={handleGarmentUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Type de vêtement</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper_body">Haut (T-shirt, veste, etc.)</SelectItem>
                  <SelectItem value="lower_body">Bas (Pantalon, jupe, etc.)</SelectItem>
                  <SelectItem value="dresses">Robe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={tryOn}
              disabled={isProcessing || !personImage || !garmentImage}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Essayage en cours...
                </>
              ) : (
                <>
                  <Shirt className="w-4 h-4 mr-2" />
                  Essayer le vêtement
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
                  <a href={resultImage} download="try-on.png" target="_blank" rel="noopener noreferrer">
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

export default VirtualTryOn;