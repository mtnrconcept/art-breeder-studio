import { useState } from 'react';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useToast } from '@/hooks/use-toast';

const Composer = () => {
  const { toast } = useToast();
  const { generateImage, isGenerating, progress } = useImageGeneration();
  
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [styleStrength, setStyleStrength] = useState([50]);
  const [faceStrength, setFaceStrength] = useState([50]);
  const [contentStrength, setContentStrength] = useState([50]);
  const [historyItems, setHistoryItems] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt required',
        description: 'Please enter a description for your image.'
      });
      return;
    }

    const composerPrompt = baseImage 
      ? `Compose this image with the following creative direction: ${prompt}. Blend the visual elements with ${styleStrength[0]}% style influence, preserving ${faceStrength[0]}% of facial features if present, and ${contentStrength[0]}% content fidelity.`
      : prompt;

    const result = await generateImage({
      prompt: composerPrompt,
      baseImageUrl: baseImage || undefined,
      styleStrength: styleStrength[0],
      faceStrength: faceStrength[0],
      contentStrength: contentStrength[0]
    });

    if (result) {
      setGeneratedImage(result.imageUrl);
      setHistoryItems((prev) => [result.imageUrl, ...prev.slice(0, 9)]);
      toast({ title: 'Image generated!' });
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    const result = await generateImage({
      prompt: `Create a variation: ${prompt}`,
      baseImageUrl: generatedImage
    });
    if (result) {
      setGeneratedImage(result.imageUrl);
      setHistoryItems((prev) => [result.imageUrl, ...prev.slice(0, 9)]);
    }
  };

  const handleEnhance = async () => {
    if (!generatedImage) return;
    const result = await generateImage({
      prompt: 'Enhance and improve the quality of this image, make it more detailed and vibrant',
      baseImageUrl: generatedImage
    });
    if (result) {
      setGeneratedImage(result.imageUrl);
      setHistoryItems((prev) => [result.imageUrl, ...prev.slice(0, 9)]);
    }
  };

  const handleClear = () => {
    setGeneratedImage(null);
    setPrompt('');
    setBaseImage(null);
  };

  const controlsPanel = baseImage && (
    <Tabs defaultValue="style" className="mt-4">
      <TabsList className="grid w-full grid-cols-3 h-8">
        <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
        <TabsTrigger value="face" className="text-xs">Face</TabsTrigger>
        <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
      </TabsList>
      
      <TabsContent value="style" className="mt-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Style Strength</span>
            <span className="text-primary">{styleStrength[0]}%</span>
          </div>
          <Slider value={styleStrength} onValueChange={setStyleStrength} max={100} step={1} />
        </div>
      </TabsContent>
      
      <TabsContent value="face" className="mt-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Face Strength</span>
            <span className="text-primary">{faceStrength[0]}%</span>
          </div>
          <Slider value={faceStrength} onValueChange={setFaceStrength} max={100} step={1} />
        </div>
      </TabsContent>
      
      <TabsContent value="content" className="mt-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Content Strength</span>
            <span className="text-primary">{contentStrength[0]}%</span>
          </div>
          <Slider value={contentStrength} onValueChange={setContentStrength} max={100} step={1} />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <ToolLayout
      title="Composer"
      description="Mix images and text with precision to create unique artworks"
      prompt={prompt}
      setPrompt={setPrompt}
      generatedImage={generatedImage}
      baseImage={baseImage}
      onBaseImageChange={setBaseImage}
      isGenerating={isGenerating}
      progress={progress}
      onGenerate={handleGenerate}
      onVary={handleVary}
      onEnhance={handleEnhance}
      onClear={handleClear}
      generateLabel="Generate"
      promptPlaceholder="Describe what you want to create... e.g., 'a majestic hippopotamus in a fantasy forest'"
      historyItems={historyItems}
      onHistorySelect={setGeneratedImage}
      controlsPanel={controlsPanel}
    />
  );
};

export default Composer;
