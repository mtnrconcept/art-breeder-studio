import { useState, useCallback } from 'react';
import { VideoToolLayout } from '@/components/tools/VideoToolLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VideoExtend = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const extendVideo = async () => {
    if (!videoUrl || !prompt.trim()) {
      toast({ title: 'Champs requis', description: 'Vidéo et description sont requis', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('extend-video', {
        body: { videoUrl, prompt, duration },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultVideo(data.videoUrl);
      setHistory(prev => [data.videoUrl, ...prev].slice(0, 8));
      setProgress(100);
      toast({ title: 'Vidéo étendue !', description: 'La continuation est prête.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de traitement', variant: 'destructive' });
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const controlsPanel = (
    <div>
      <Label className="text-xs text-muted-foreground">Durée de l'extension</Label>
      <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v) as 5 | 10)}>
        <SelectTrigger className="mt-1 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 secondes</SelectItem>
          <SelectItem value="10">10 secondes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <VideoToolLayout
      title="Video Extend"
      description="Prolongez vos vidéos avec l'IA en décrivant ce qui doit se passer ensuite."
      icon={<Plus className="w-10 h-10 text-white" />}
      iconGradient="bg-gradient-to-br from-teal-500 to-emerald-500"
      prompt={prompt}
      setPrompt={setPrompt}
      promptPlaceholder="Ex: Le personnage se retourne et commence à courir vers la caméra..."
      sourceMedia={videoUrl}
      sourceMediaType="video"
      onSourceMediaChange={setVideoUrl}
      sourceMediaLabel="Vidéo source"
      resultVideo={resultVideo}
      isProcessing={isProcessing}
      progress={progress}
      onGenerate={extendVideo}
      generateLabel="Prolonger la vidéo"
      generateDisabled={!videoUrl || !prompt.trim()}
      controlsPanel={controlsPanel}
      historyItems={history}
      onHistorySelect={(item) => setResultVideo(item)}
    />
  );
};

export default VideoExtend;
