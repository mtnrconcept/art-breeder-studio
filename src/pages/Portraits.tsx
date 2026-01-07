import { useState } from 'react';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Portraits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  
  // Portrait parameters
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('any');
  const [style, setStyle] = useState('realistic');
  const [expression, setExpression] = useState('neutral');

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: "Veuillez vous connecter", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const genderText = gender === 'any' ? 'person' : gender === 'male' ? 'man' : 'woman';
      const styleMap: Record<string, string> = {
        'realistic': 'photorealistic, studio photography quality',
        'artistic': 'artistic painting style, painterly brushstrokes',
        'anime': 'anime/manga art style with large expressive eyes',
        'oil-painting': 'classical oil painting style, Renaissance masters technique'
      };
      const expressionMap: Record<string, string> = {
        'neutral': 'calm neutral expression, relaxed face',
        'happy': 'genuine warm smile, happy sparkling eyes',
        'serious': 'serious contemplative expression, focused gaze',
        'mysterious': 'enigmatic mysterious expression, slight Mona Lisa smile',
        'surprised': 'surprised expression with raised eyebrows'
      };

      const portraitPrompt = `Portrait of a ${genderText}, apparent age ${age} years old. ${styleMap[style] || style}. ${expressionMap[expression] || expression}. ${prompt ? `Additional details: ${prompt}.` : ''} High-resolution face with natural skin texture, realistic eye reflections, well-defined facial features, flattering studio lighting.`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: portraitPrompt,
          baseImageUrl: referenceImage,
          type: 'portrait'
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
        toast({ title: "Portrait généré !" });
      }
    } catch (error) {
      console.error('Portrait error:', error);
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
        body: { prompt: `Create a variation of this portrait: ${prompt}`, baseImageUrl: generatedImage, type: 'portrait' }
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
        body: { prompt: 'Enhance this portrait with better quality, sharper details, professional lighting', baseImageUrl: generatedImage, type: 'tune' }
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
          <label className="text-xs text-muted-foreground mb-1 block">Genre</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-8 text-xs">
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
          <label className="text-xs text-muted-foreground mb-1 block">Style</label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realistic">Réaliste</SelectItem>
              <SelectItem value="artistic">Artistique</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="oil-painting">Peinture</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Âge</span>
          <span className="text-primary">{age} ans</span>
        </div>
        <Slider value={[age]} onValueChange={([v]) => setAge(v)} min={5} max={90} step={1} />
      </div>
      
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Expression</label>
        <Select value={expression} onValueChange={setExpression}>
          <SelectTrigger className="h-8 text-xs">
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
    </div>
  );

  return (
    <ToolLayout
      title="Portraits"
      description="Generate photorealistic portraits with precise genetic control"
      prompt={prompt}
      setPrompt={setPrompt}
      generatedImage={generatedImage}
      baseImage={referenceImage}
      onBaseImageChange={setReferenceImage}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
      onVary={handleVary}
      onEnhance={handleEnhance}
      onClear={() => { setGeneratedImage(null); setPrompt(''); setReferenceImage(null); }}
      generateLabel="Generate Portrait"
      promptPlaceholder="Ex: cheveux bruns, yeux bleus, barbe légère..."
      historyItems={historyItems}
      onHistorySelect={setGeneratedImage}
      controlsPanel={controlsPanel}
    />
  );
};

export default Portraits;
