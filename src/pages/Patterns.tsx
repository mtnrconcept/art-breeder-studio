import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Download, Palette, Sparkles, AlertCircle } from 'lucide-react';
import { patternGenerate } from '@/lib/gemini';

const Patterns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pattern parameters
  const [patternType, setPatternType] = useState('geometric');
  const [colorScheme, setColorScheme] = useState('vibrant');
  const [complexity, setComplexity] = useState(50);
  const [seamless, setSeamless] = useState(true);

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: "Veuillez vous connecter", variant: "destructive" });
      return;
    }

    if (!prompt.trim()) {
      toast({ title: "Entrez une description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const typeMap: Record<string, string> = {
        'geometric': 'geometric shapes, clean lines',
        'organic': 'organic flowing forms, natural curves',
        'floral': 'botanical flowers and leaves',
        'abstract': 'abstract expressionist forms',
        'tribal': 'tribal and ethnic motifs',
        'art-deco': 'Art Deco style, geometric elegance'
      };

      const fullPrompt = `Seamless tileable pattern of ${prompt}. Style: ${typeMap[patternType] || patternType}. Colors: ${colorScheme}. Complexity level: ${complexity}%. Must repeat perfectly.`;

      const result = await patternGenerate("", fullPrompt); // No pattern ref image for now, just text-to-pattern

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({ title: "Pattern généré !" });
      } else {
        const errorMsg = result.error || "Erreur lors de la génération";
        setError(errorMsg);
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      console.error('Pattern error:', error);
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de la génération";
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
    link.download = `pattern-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Patterns</h1>
            <p className="text-muted-foreground">Créez des motifs et textures pour vos projets design</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="glass-panel p-6 space-y-6">
              <h2 className="text-lg font-semibold">Paramètres du pattern</h2>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: feuilles tropicales, vagues japonaises..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Type</label>
                  <Select value={patternType} onValueChange={setPatternType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geometric">Géométrique</SelectItem>
                      <SelectItem value="organic">Organique</SelectItem>
                      <SelectItem value="floral">Floral</SelectItem>
                      <SelectItem value="abstract">Abstrait</SelectItem>
                      <SelectItem value="tribal">Tribal</SelectItem>
                      <SelectItem value="art-deco">Art Déco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Palette</label>
                  <Select value={colorScheme} onValueChange={setColorScheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                      <SelectItem value="earth">Terreux</SelectItem>
                      <SelectItem value="neon">Néon</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Complexité: {complexity}%</label>
                <Slider
                  value={[complexity]}
                  onValueChange={([v]) => setComplexity(v)}
                  min={10}
                  max={100}
                  step={10}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Pattern sans couture (tileable)</label>
                <Button
                  variant={seamless ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeamless(!seamless)}
                >
                  {seamless ? "Activé" : "Désactivé"}
                </Button>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full gradient-primary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer le pattern
                  </>
                )}
              </Button>
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
                  <img src={generatedImage} alt="Generated pattern" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Le pattern apparaîtra ici</p>
                  </div>
                )}
              </div>

              {/* Preview tiled */}
              {generatedImage && seamless && (
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground mb-2 block">Aperçu en mosaïque</label>
                  <div
                    className="h-32 rounded-lg"
                    style={{
                      backgroundImage: `url(${generatedImage})`,
                      backgroundSize: '64px 64px',
                      backgroundRepeat: 'repeat'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Patterns;
