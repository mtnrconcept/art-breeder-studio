import { useState } from 'react';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Tuner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  
  // Enhancement parameters
  const [preset, setPreset] = useState('enhance');
  const [intensity, setIntensity] = useState(50);
  const [sharpness, setSharpness] = useState(50);
  const [colorBoost, setColorBoost] = useState(50);

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
        enhance: `General enhancement: improve overall clarity, optimize exposure, enhance natural colors. Intensity: ${intensity}%`,
        portrait: `Portrait optimization: smooth skin texture naturally (${intensity}%), enhance eye clarity and catchlights, improve hair detail.`,
        landscape: `Landscape enhancement: boost sky vibrancy, enhance foliage colors, add atmospheric depth (${intensity}%).`,
        vintage: `Vintage film look: add warm color cast, slight fade in blacks, film grain texture (${intensity}%).`,
        cinematic: `Cinematic color grade: teal and orange color scheme, dramatic contrast (${intensity}%).`,
        hdr: `HDR enhancement: expand dynamic range (${intensity}%), recover shadow details, protect highlights.`
      };

      const tunePrompt = `Apply these professional adjustments to the image:
${presetDescriptions[preset] || presetDescriptions['enhance']}
Sharpness: ${sharpness}%. Color boost: ${colorBoost}%. ${prompt ? `Additional: ${prompt}` : ''}
Preserve the original subject and composition.`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: tunePrompt, baseImageUrl: sourceImage, type: 'tune' }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
        toast({ title: "Image améliorée !" });
      }
    } catch (error) {
      console.error('Tune error:', error);
      toast({ title: "Erreur lors de l'amélioration", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-image', {
        body: { prompt: `Create a variation with different enhancement style`, baseImageUrl: generatedImage, type: 'tune' }
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
        body: { prompt: 'Further enhance quality, sharpen details, improve overall clarity', baseImageUrl: generatedImage, type: 'tune' }
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
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Preset</label>
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enhance">General</SelectItem>
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="vintage">Vintage</SelectItem>
            <SelectItem value="cinematic">Cinematic</SelectItem>
            <SelectItem value="hdr">HDR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Intensity</span>
          <span className="text-primary">{intensity}%</span>
        </div>
        <Slider value={[intensity]} onValueChange={([v]) => setIntensity(v)} max={100} step={5} />
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Sharpness</span>
          <span className="text-primary">{sharpness}%</span>
        </div>
        <Slider value={[sharpness]} onValueChange={([v]) => setSharpness(v)} max={100} step={5} />
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Color Boost</span>
          <span className="text-primary">{colorBoost}%</span>
        </div>
        <Slider value={[colorBoost]} onValueChange={([v]) => setColorBoost(v)} max={100} step={5} />
      </div>
    </div>
  );

  return (
    <ToolLayout
      title="Tuner"
      description="Enhance and fine-tune your images with AI-powered adjustments"
      prompt={prompt}
      setPrompt={setPrompt}
      generatedImage={generatedImage}
      baseImage={sourceImage}
      onBaseImageChange={setSourceImage}
      isGenerating={isGenerating}
      onGenerate={handleTune}
      onVary={handleVary}
      onEnhance={handleEnhance}
      onClear={() => { setGeneratedImage(null); setPrompt(''); setSourceImage(null); }}
      generateLabel="Enhance"
      promptPlaceholder="Additional adjustments (optional)..."
      historyItems={historyItems}
      onHistorySelect={setGeneratedImage}
      controlsPanel={controlsPanel}
    />
  );
};

export default Tuner;
