import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, Download, Sparkles, RotateCcw } from 'lucide-react';

const Tuner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Enhancement parameters
  const [preset, setPreset] = useState('enhance');
  const [intensity, setIntensity] = useState(50);
  const [sharpness, setSharpness] = useState(50);
  const [colorBoost, setColorBoost] = useState(50);
  const [noiseReduction, setNoiseReduction] = useState(30);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setSourceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetSettings = () => {
    setPreset('enhance');
    setIntensity(50);
    setSharpness(50);
    setColorBoost(50);
    setNoiseReduction(30);
  };

  const handleTune = async () => {
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
      const presetDescriptions: Record<string, string> = {
        enhance: 'Enhance overall quality and details',
        portrait: 'Optimize for portrait photography with skin smoothing and eye enhancement',
        landscape: 'Enhance landscape with vibrant colors and atmospheric depth',
        vintage: 'Apply vintage film-like aesthetic with warm tones and grain',
        cinematic: 'Apply cinematic color grading with dramatic contrast',
        hdr: 'Create HDR effect with enhanced dynamic range'
      };

      const tunePrompt = `${presetDescriptions[preset]}. Enhancement intensity: ${intensity}%, sharpness: ${sharpness}%, color boost: ${colorBoost}%, noise reduction: ${noiseReduction}%. Maintain the original composition while improving quality.`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: tunePrompt,
          baseImage: sourceImage,
          type: 'tune'
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({ title: "Image améliorée !" });
      }
    } catch (error) {
      console.error('Tune error:', error);
      toast({ title: "Erreur lors de l'amélioration", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `tuned-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Tuner</h1>
            <p className="text-muted-foreground">Améliorez et ajustez vos images avec l'IA</p>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Paramètres d'amélioration</h2>
                  <Button variant="ghost" size="sm" onClick={resetSettings}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Preset</label>
                  <Select value={preset} onValueChange={setPreset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enhance">Amélioration générale</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Paysage</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="cinematic">Cinématique</SelectItem>
                      <SelectItem value="hdr">HDR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Intensité: {intensity}%
                  </label>
                  <Slider
                    value={[intensity]}
                    onValueChange={([v]) => setIntensity(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Netteté: {sharpness}%
                  </label>
                  <Slider
                    value={[sharpness]}
                    onValueChange={([v]) => setSharpness(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Boost couleurs: {colorBoost}%
                  </label>
                  <Slider
                    value={[colorBoost]}
                    onValueChange={([v]) => setColorBoost(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Réduction bruit: {noiseReduction}%
                  </label>
                  <Slider
                    value={[noiseReduction]}
                    onValueChange={([v]) => setNoiseReduction(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <Button 
                  onClick={handleTune}
                  disabled={isGenerating || !sourceImage}
                  className="w-full gradient-primary"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Amélioration en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Améliorer l'image
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
                  <img src={generatedImage} alt="Enhanced image" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>L'image améliorée apparaîtra ici</p>
                  </div>
                )}
              </div>

              {/* Before/After comparison */}
              {sourceImage && generatedImage && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Avant</label>
                    <img src={sourceImage} alt="Before" className="w-full rounded-lg" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Après</label>
                    <img src={generatedImage} alt="After" className="w-full rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tuner;
