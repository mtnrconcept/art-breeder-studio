import { useState } from 'react';
import { VideoToolLayout } from '@/components/tools/VideoToolLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TextToVideo = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'kling' | 'minimax' | 'veo3'>('kling');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Prompt requis', description: 'Veuillez entrer une description', variant: 'destructive' });
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
          type: 'text-to-video',
          prompt,
          model,
          duration,
          aspectRatio,
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
    <div className="grid grid-cols-3 gap-3">
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

      <div>
        <Label className="text-xs text-muted-foreground">Format</Label>
        <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as any)}>
          <SelectTrigger className="mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9</SelectItem>
            <SelectItem value="9:16">9:16</SelectItem>
            <SelectItem value="1:1">1:1</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <VideoToolLayout
      title="Text to Video"
      description="Générez des vidéos à partir de descriptions textuelles avec Kling, Minimax ou Veo3."
      icon={<Video className="w-10 h-10 text-white" />}
      iconGradient="bg-gradient-to-br from-violet-500 to-purple-600"
      prompt={prompt}
      setPrompt={setPrompt}
      promptPlaceholder="Ex: Une voiture de sport rouge roulant sur une route côtière au coucher du soleil, vue cinématique..."
      resultVideo={resultVideo}
      isProcessing={isGenerating}
      progress={progress}
      onGenerate={generateVideo}
      generateLabel="Générer la vidéo"
      generateDisabled={!prompt.trim()}
      controlsPanel={controlsPanel}
      hideSourceMedia
      historyItems={history}
      onHistorySelect={(item) => setResultVideo(item)}
    />
  );
};

export default TextToVideo;
