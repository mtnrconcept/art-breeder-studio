import { useState } from 'react';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const Outpainter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  
  // Outpaint parameters
  const [direction, setDirection] = useState<'all' | 'up' | 'down' | 'left' | 'right'>('all');
  const [expansionAmount, setExpansionAmount] = useState(50);

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
      const directionMap: Record<string, string> = {
        'all': 'Expand equally in all four directions',
        'up': 'Expand upward, adding more sky/ceiling/background above',
        'down': 'Expand downward, adding more ground/floor/foreground below',
        'left': 'Expand to the left, continuing the scene leftward',
        'right': 'Expand to the right, continuing the scene rightward'
      };

      const outpaintPrompt = `${directionMap[direction]}. Expansion amount: ${expansionAmount}%. ${prompt ? `Scene guidance: ${prompt}.` : 'Continue the existing scene naturally.'}
Match the exact art style, lighting, and textures. No visible seams.`;

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
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
        toast({ title: "Image étendue !" });
      }
    } catch (error) {
      console.error('Outpaint error:', error);
      toast({ title: "Erreur lors de l'extension", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-image', {
        body: { prompt: `Create a variation of this extended image`, baseImageUrl: generatedImage, type: 'outpaint' }
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
        body: { prompt: 'Enhance quality and blend seams better', baseImageUrl: generatedImage, type: 'tune' }
      });
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const DirectionButton = ({ dir, icon: Icon }: { dir: typeof direction; icon: React.ElementType }) => (
    <Button
      variant={direction === dir ? "default" : "outline"}
      size="icon"
      onClick={() => setDirection(dir)}
      className={`h-8 w-8 ${direction === dir ? 'gradient-primary border-0' : ''}`}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  const controlsPanel = (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Direction</label>
        <div className="flex flex-col items-center gap-1">
          <DirectionButton dir="up" icon={ArrowUp} />
          <div className="flex gap-1">
            <DirectionButton dir="left" icon={ArrowLeft} />
            <Button
              variant={direction === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setDirection('all')}
              className={`h-8 text-xs ${direction === 'all' ? 'gradient-primary border-0' : ''}`}
            >
              All
            </Button>
            <DirectionButton dir="right" icon={ArrowRight} />
          </div>
          <DirectionButton dir="down" icon={ArrowDown} />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Expansion</span>
          <span className="text-primary">{expansionAmount}%</span>
        </div>
        <Slider value={[expansionAmount]} onValueChange={([v]) => setExpansionAmount(v)} min={10} max={100} step={10} />
      </div>
    </div>
  );

  return (
    <ToolLayout
      title="Outpainter"
      description="Expand your images beyond their borders seamlessly"
      prompt={prompt}
      setPrompt={setPrompt}
      generatedImage={generatedImage}
      baseImage={sourceImage}
      onBaseImageChange={setSourceImage}
      isGenerating={isGenerating}
      onGenerate={handleOutpaint}
      onVary={handleVary}
      onEnhance={handleEnhance}
      onClear={() => { setGeneratedImage(null); setPrompt(''); setSourceImage(null); }}
      generateLabel="Expand"
      promptPlaceholder="Ex: continuer avec une forêt, ajouter un ciel nuageux..."
      historyItems={historyItems}
      onHistorySelect={setGeneratedImage}
      controlsPanel={controlsPanel}
    />
  );
};

export default Outpainter;
