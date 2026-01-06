import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, Download, Wand2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const Outpainter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  // Outpaint parameters
  const [direction, setDirection] = useState<'all' | 'up' | 'down' | 'left' | 'right'>('all');
  const [expansionAmount, setExpansionAmount] = useState(50);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setSourceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleOutpaint = async () => {
    if (!user) {
      toast({ title: "Veuillez vous connecter", variant: "destructive" });
      return;
    }

    if (!sourceImage) {
      toast({ title: "Ajoutez une image source", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Outpainter: Expand image beyond borders like Artbreeder's outpainter
      const directionMap: Record<string, string> = {
        'all': 'Expand equally in all four directions (top, bottom, left, right)',
        'up': 'Expand upward, adding more sky/ceiling/background above',
        'down': 'Expand downward, adding more ground/floor/foreground below',
        'left': 'Expand to the left, continuing the scene leftward',
        'right': 'Expand to the right, continuing the scene rightward'
      };

      const outpaintPrompt = `${directionMap[direction] || directionMap['all']}. Expansion amount: ${expansionAmount}% of original size. ${prompt ? `Scene extension guidance: ${prompt}.` : 'Continue the existing scene naturally.'} 

Critical requirements:
- Match the exact art style, brushwork, and rendering technique
- Continue perspective lines and maintain correct vanishing points  
- Seamlessly extend all textures and patterns
- Match lighting direction, intensity, and color temperature exactly
- No visible seam between original and extended areas
- Maintain consistent level of detail throughout`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: outpaintPrompt,
          baseImageUrl: sourceImage,
          type: 'outpaint',
          direction,
          expansionAmount
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({ title: "Image étendue avec succès !" });
      }
    } catch (error) {
      console.error('Outpaint error:', error);
      toast({ title: "Erreur lors de l'extension", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `outpaint-${Date.now()}.png`;
    link.click();
  };

  const DirectionButton = ({ dir, icon: Icon }: { dir: typeof direction; icon: React.ElementType }) => (
    <Button
      variant={direction === dir ? "default" : "outline"}
      size="icon"
      onClick={() => setDirection(dir)}
      className={direction === dir ? 'gradient-primary border-0' : ''}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Outpainter</h1>
            <p className="text-muted-foreground">Étendez vos images au-delà de leurs bordures</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Source & Controls */}
            <div className="space-y-6">
              {/* Source Image */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold mb-4">Image source</h2>
                {sourceImage ? (
                  <div className="relative">
                    <img src={sourceImage} alt="Source" className="w-full rounded-lg" />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSourceImage(null);
                        setGeneratedImage(null);
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <span className="text-muted-foreground">Glissez ou cliquez pour ajouter une image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Controls */}
              <div className="glass-panel p-6 space-y-6">
                <h2 className="text-lg font-semibold">Paramètres d'extension</h2>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Description (optionnel)</label>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: continuer avec une forêt, ajouter un ciel nuageux..."
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">Direction</label>
                  <div className="flex flex-col items-center gap-2">
                    <DirectionButton dir="up" icon={ArrowUp} />
                    <div className="flex gap-2">
                      <DirectionButton dir="left" icon={ArrowLeft} />
                      <Button
                        variant={direction === 'all' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDirection('all')}
                        className={direction === 'all' ? 'gradient-primary border-0' : ''}
                      >
                        Tous
                      </Button>
                      <DirectionButton dir="right" icon={ArrowRight} />
                    </div>
                    <DirectionButton dir="down" icon={ArrowDown} />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Quantité d'extension: {expansionAmount}%
                  </label>
                  <Slider
                    value={[expansionAmount]}
                    onValueChange={([v]) => setExpansionAmount(v)}
                    min={10}
                    max={100}
                    step={10}
                  />
                </div>

                <Button 
                  onClick={handleOutpaint}
                  disabled={isGenerating || !sourceImage}
                  className="w-full gradient-primary"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extension en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Étendre l'image
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
                  <img src={generatedImage} alt="Extended image" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Wand2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>L'image étendue apparaîtra ici</p>
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

export default Outpainter;
