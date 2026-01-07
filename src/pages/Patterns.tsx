import { useState } from 'react';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Patterns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [patternImage, setPatternImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  
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
    try {
      const typeMap: Record<string, string> = {
        'geometric': 'geometric shapes, mathematical precision, clean lines',
        'organic': 'organic flowing forms, natural curves, biomorphic shapes',
        'floral': 'botanical flowers and leaves, nature-inspired motifs',
        'abstract': 'abstract expressionist forms, non-representational shapes',
        'tribal': 'tribal and ethnic motifs, cultural patterns',
        'art-deco': 'Art Deco style, 1920s geometric elegance, gold accents'
      };
      const colorMap: Record<string, string> = {
        'vibrant': 'vibrant saturated colors, high contrast',
        'pastel': 'soft pastel colors, gentle muted tones',
        'monochrome': 'monochromatic palette, single color variations',
        'earth': 'earthy natural colors, browns greens and terracotta',
        'neon': 'neon bright colors, electric glowing hues',
        'vintage': 'vintage muted colors, aged nostalgic palette'
      };

      const patternPrompt = `Create ${prompt} using a ${patternType} pattern style. ${typeMap[patternType] || ''}. Color scheme: ${colorMap[colorScheme] || colorScheme}. Detail complexity: ${complexity}%. ${seamless ? 'Make this a seamless tileable pattern.' : ''}`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: patternPrompt,
          patternImageUrl: patternImage,
          type: 'pattern'
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
        toast({ title: "Pattern généré !" });
      }
    } catch (error) {
      console.error('Pattern error:', error);
      toast({ title: "Erreur lors de la génération", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-image', {
        body: { prompt: `Create a variation of this pattern: ${prompt}`, baseImageUrl: generatedImage, type: 'pattern' }
      });
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-image', {
        body: { prompt: 'Enhance pattern details and colors', baseImageUrl: generatedImage, type: 'tune' }
      });
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const controlsPanel = (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Type</label>
          <Select value={patternType} onValueChange={setPatternType}>
            <SelectTrigger className="h-8 text-xs">
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
          <label className="text-xs text-muted-foreground mb-1 block">Palette</label>
          <Select value={colorScheme} onValueChange={setColorScheme}>
            <SelectTrigger className="h-8 text-xs">
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
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Complexity</span>
          <span className="text-primary">{complexity}%</span>
        </div>
        <Slider value={[complexity]} onValueChange={([v]) => setComplexity(v)} min={10} max={100} step={10} />
      </div>

      <Button 
        variant={seamless ? "default" : "outline"} 
        size="sm"
        onClick={() => setSeamless(!seamless)}
        className="w-full text-xs"
      >
        {seamless ? "✓ Seamless Tileable" : "Non-tileable"}
      </Button>

      {generatedImage && seamless && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tiled Preview</label>
          <div 
            className="h-16 rounded-lg border border-border/50"
            style={{
              backgroundImage: `url(${generatedImage})`,
              backgroundSize: '48px 48px',
              backgroundRepeat: 'repeat'
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      title="Patterns"
      description="Create seamless patterns and textures for your designs"
      prompt={prompt}
      setPrompt={setPrompt}
      generatedImage={generatedImage}
      baseImage={patternImage}
      onBaseImageChange={setPatternImage}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
      onVary={handleVary}
      onEnhance={handleEnhance}
      onClear={() => { setGeneratedImage(null); setPrompt(''); setPatternImage(null); }}
      generateLabel="Generate Pattern"
      promptPlaceholder="Ex: feuilles tropicales, vagues japonaises..."
      historyItems={historyItems}
      onHistorySelect={setGeneratedImage}
      controlsPanel={controlsPanel}
    />
  );
};

export default Patterns;
