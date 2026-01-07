import { useState, useCallback } from 'react';
import { VideoToolLayout } from '@/components/tools/VideoToolLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Wand2, Camera, RotateCcw, Zap, Move } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Effect = 'camera-motion' | 'style-transfer' | 'slow-motion' | 'loop' | 'depth';

const EFFECTS = [
  { value: 'camera-motion', label: 'Mouvement de caméra', icon: Camera },
  { value: 'style-transfer', label: 'Transfert de style', icon: Wand2 },
  { value: 'slow-motion', label: 'Slow motion', icon: RotateCcw },
  { value: 'loop', label: 'Loop parfait', icon: Zap },
  { value: 'depth', label: 'Effet de profondeur', icon: Move },
];

const VideoEffects = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [effect, setEffect] = useState<Effect>('camera-motion');
  const [prompt, setPrompt] = useState('');
  const [cameraMotion, setCameraMotion] = useState({
    horizontal: 0,
    vertical: 0,
    zoom: 0,
    pan: 0,
    tilt: 0,
    roll: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const applyEffect = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('video-effects', {
        body: {
          imageUrl,
          effect,
          prompt: prompt || undefined,
          cameraMotion: effect === 'camera-motion' ? cameraMotion : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultVideo(data.videoUrl);
      setHistory(prev => [data.videoUrl, ...prev].slice(0, 8));
      setProgress(100);
      toast({ title: 'Effet appliqué !', description: 'Votre vidéo est prête.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de traitement', variant: 'destructive' });
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const controlsPanel = (
    <div className="space-y-4">
      {/* Effect Selection */}
      <div>
        <Label className="text-xs text-muted-foreground">Effet</Label>
        <Select value={effect} onValueChange={(v) => setEffect(v as Effect)}>
          <SelectTrigger className="mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EFFECTS.map((e) => {
              const Icon = e.icon;
              return (
                <SelectItem key={e.value} value={e.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {e.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Camera Motion Controls */}
      {effect === 'camera-motion' && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs text-muted-foreground">Contrôles de caméra</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(cameraMotion).map(([key, value]) => (
              <div key={key}>
                <Label className="text-xs capitalize">{key}: {value}</Label>
                <Slider
                  value={[value]}
                  onValueChange={(v) => setCameraMotion(prev => ({ ...prev, [key]: v[0] }))}
                  min={-10}
                  max={10}
                  step={1}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style Transfer Prompt */}
      {effect === 'style-transfer' && (
        <div>
          <Label className="text-xs text-muted-foreground">Style souhaité</Label>
          <Textarea
            placeholder="Ex: Style anime, peinture à l'huile impressionniste..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 min-h-16 text-sm resize-none"
          />
        </div>
      )}
    </div>
  );

  return (
    <VideoToolLayout
      title="Video Effects"
      description="Appliquez des effets cinématiques spectaculaires à vos images."
      icon={<Wand2 className="w-10 h-10 text-white" />}
      iconGradient="bg-gradient-to-br from-cyan-500 to-blue-500"
      sourceMedia={imageUrl}
      sourceMediaType="image"
      onSourceMediaChange={setImageUrl}
      sourceMediaLabel="Image source"
      resultVideo={resultVideo}
      isProcessing={isProcessing}
      progress={progress}
      onGenerate={applyEffect}
      generateLabel="Appliquer l'effet"
      generateDisabled={!imageUrl}
      controlsPanel={controlsPanel}
      hidePrompt
      historyItems={history}
      onHistorySelect={(item) => setResultVideo(item)}
    />
  );
};

export default VideoEffects;
