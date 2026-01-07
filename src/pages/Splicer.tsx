import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Loader2, Download, Trash2, Shapes, AlertCircle } from 'lucide-react';
import { spliceImages } from '@/lib/gemini';

const Splicer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<{ file: File; preview: string; weight: number }[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 4) {
      toast({ title: "Maximum 4 images", variant: "destructive" });
      return;
    }

    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      weight: 50
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateWeight = (index: number, weight: number) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, weight } : img));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleSplice = async () => {
    if (!user) {
      toast({ title: "Veuillez vous connecter", variant: "destructive" });
      return;
    }

    if (images.length < 2) {
      toast({ title: "Ajoutez au moins 2 images", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const imageDataPromises = images.map(async (img) => await fileToBase64(img.file));
      const base64Images = await Promise.all(imageDataPromises);

      // Splicer: Crossbreed images like genetic mixing - blend their visual DNA
      const result = await spliceImages(base64Images);

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({ title: "Images croisées génétiquement !" });
      } else {
        const errorMsg = result.error || 'Erreur lors du croisement';
        setError(errorMsg);
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      console.error('Splice error:', error);
      const errorMsg = error instanceof Error ? error.message : "Erreur lors du croisement";
      setError(errorMsg);
      toast({ title: errorMsg, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `splice-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
              <Shapes className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Splicer</h1>
            <p className="text-muted-foreground">Fusionnez plusieurs images pour créer des œuvres hybrides uniques</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Image Upload */}
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold mb-4">Images à fusionner (2-4)</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Image ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                      <div className="mt-2">
                        <label className="text-xs text-muted-foreground">Poids: {img.weight}%</label>
                        <Slider
                          value={[img.weight]}
                          onValueChange={([v]) => updateWeight(index, v)}
                          min={0}
                          max={100}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}

                  {images.length < 4 && (
                    <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Ajouter</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <Button
                  onClick={handleSplice}
                  disabled={isGenerating || images.length < 2}
                  className="w-full gradient-primary"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fusion en cours...
                    </>
                  ) : (
                    <>
                      <Shapes className="w-4 h-4 mr-2" />
                      Fusionner les images
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Result */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Résultat</h2>
                {generatedImage && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                )}
              </div>

              <div className="aspect-square bg-card/50 rounded-lg overflow-hidden flex items-center justify-center">
                {generatedImage ? (
                  <img src={generatedImage} alt="Spliced result" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Shapes className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Le résultat apparaîtra ici</p>
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

export default Splicer;
