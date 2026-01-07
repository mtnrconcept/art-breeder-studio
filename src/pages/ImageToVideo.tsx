import { useState, useCallback } from 'react';
import { VideoToolLayout } from '@/components/tools/VideoToolLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ImageToVideo = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'kling' | 'minimax' | 'veo3'>('kling');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const generateVideo = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', description: 'Veuillez télécharger une image', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          type: 'image-to-video',
          prompt: prompt || 'smooth cinematic motion',
          imageUrl,
          model,
          duration,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultVideo(data.videoUrl);
      setHistory(prev => [data.videoUrl, ...prev].slice(0, 8));
      setProgress(100);
      toast({ title: 'Vidéo générée !', description: 'Votre vidéo est prête.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de génération', variant: 'destructive' });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const controlsPanel = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-muted-foreground">Modèle</Label>
        <Select value={model} onValueChange={(v) => setModel(v as any)}>
          <SelectTrigger className="mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kling">Kling v1.6</SelectItem>
            <SelectItem value="minimax">Minimax</SelectItem>
            <SelectItem value="veo3">Veo3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Durée</Label>
        <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v) as 5 | 10)}>
          <SelectTrigger className="mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 sec</SelectItem>
            <SelectItem value="10">10 sec</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <VideoToolLayout
      title="Image to Video"
      description="Animez vos images en vidéos fluides avec l'IA."
      icon={<Film className="w-10 h-10 text-white" />}
      iconGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
      prompt={prompt}
      setPrompt={setPrompt}
      promptPlaceholder="Ex: La caméra zoome lentement, les feuilles bougent doucement dans le vent..."
      sourceMedia={imageUrl}
      sourceMediaType="image"
      onSourceMediaChange={setImageUrl}
      sourceMediaLabel="Image source"
      resultVideo={resultVideo}
      isProcessing={isGenerating}
      progress={progress}
      onGenerate={generateVideo}
      generateLabel="Animer l'image"
      generateDisabled={!imageUrl}
      controlsPanel={controlsPanel}
      historyItems={history}
      onHistorySelect={(item) => setResultVideo(item)}
    />
  );
};

export default ImageToVideo;
