import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generatePortrait } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';
import { AspectRatioSelector, AspectRatio } from '@/components/shared/AspectRatioSelector';
import { getImageDimensions } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Loader2, Download, User, Sparkles, AlertCircle } from 'lucide-react';

const Portraits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [detectedDimensions, setDetectedDimensions] = useState<{ width: number, height: number } | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Portrait parameters
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('any');
  const [style, setStyle] = useState('realistic');
  const [expression, setExpression] = useState('neutral');

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setReferenceImage(b64);
      try {
        const dims = await getImageDimensions(b64);
        setDetectedDimensions(dims);
        if (dims.width > dims.height) setAspectRatio('4:3');
        else if (dims.height > dims.width) setAspectRatio('3:4');
        else setAspectRatio('1:1');
      } catch (e) {
        console.error("Dim detection failed", e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: "Veuillez vous connecter", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const genderText = gender === 'any' ? 'person' : gender === 'male' ? 'man' : 'woman';
      const styleMap: Record<string, string> = {
        'realistic': 'photorealistic, studio photography quality',
        'artistic': 'artistic painting style, painterly brushstrokes',
        'anime': 'anime/manga art style',
        'oil-painting': 'classical oil painting style'
      };

      const fullPrompt = `Portrait of a ${genderText}, age ${age}. ${styleMap[style] || style}. ${expression} expression. ${prompt}`;

      const result = await generatePortrait(fullPrompt, {
        aspectRatio,
        width: detectedDimensions?.width,
        height: detectedDimensions?.height,
        style: style === 'realistic' ? 'photorealistic' : style,
        baseImage: referenceImage || undefined
      });

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({ title: "Portrait généré !" });
      } else {
        const errorMsg = result.error || "Erreur lors de la génération";
        setError(errorMsg);
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      console.error('Portrait error:', error);
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
    link.download = `portrait-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Portraits</h1>
            <p className="text-muted-foreground">Générez des portraits réalistes avec un contrôle précis</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="space-y-6">
              {/* Reference Image */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold mb-4">Image de référence (optionnel)</h2>
                {referenceImage ? (
                  <div className="relative">
                    <img src={referenceImage} alt="Reference" className="w-full rounded-lg" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setReferenceImage(null)}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <span className="text-muted-foreground">Ajouter une image de référence</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Portrait Parameters */}
              <div className="glass-panel p-6 space-y-6">
                <h2 className="text-lg font-semibold">Paramètres du portrait</h2>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: cheveux bruns, yeux bleus, souriant..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Genre</label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Indifférent</SelectItem>
                        <SelectItem value="male">Homme</SelectItem>
                        <SelectItem value="female">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Style</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Réaliste</SelectItem>
                        <SelectItem value="artistic">Artistique</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="oil-painting">Peinture à l'huile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Âge: {age} ans</label>
                  <Slider
                    value={[age]}
                    onValueChange={([v]) => setAge(v)}
                    min={5}
                    max={90}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Expression</label>
                  <Select value={expression} onValueChange={setExpression}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutre</SelectItem>
                      <SelectItem value="happy">Joyeux</SelectItem>
                      <SelectItem value="serious">Sérieux</SelectItem>
                      <SelectItem value="mysterious">Mystérieux</SelectItem>
                      <SelectItem value="surprised">Surpris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AspectRatioSelector
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  customDimensions={detectedDimensions}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
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
                    Générer le portrait
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
                <img src={generatedImage} alt="Generated portrait" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Le portrait apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portraits;
