import { ReactNode, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Trash2, 
  HelpCircle, 
  History, 
  Download, 
  Loader2,
  Upload,
  Video,
  Home,
  X,
  Play
} from 'lucide-react';

interface VideoToolLayoutProps {
  children?: ReactNode;
  title: string;
  description: string;
  icon: ReactNode;
  iconGradient: string;
  prompt?: string;
  setPrompt?: (value: string) => void;
  sourceMedia?: string | null;
  sourceMediaType?: 'image' | 'video';
  onSourceMediaChange?: (media: string | null) => void;
  resultVideo: string | null;
  isProcessing: boolean;
  progress?: number;
  onGenerate: () => void;
  generateLabel?: string;
  generateDisabled?: boolean;
  promptPlaceholder?: string;
  controlsPanel?: ReactNode;
  hidePrompt?: boolean;
  hideSourceMedia?: boolean;
  sourceMediaLabel?: string;
  historyItems?: string[];
  onHistorySelect?: (item: string) => void;
}

export const VideoToolLayout = ({
  title,
  description,
  icon,
  iconGradient,
  prompt = '',
  setPrompt,
  sourceMedia,
  sourceMediaType = 'image',
  onSourceMediaChange,
  resultVideo,
  isProcessing,
  progress = 0,
  onGenerate,
  generateLabel = 'Generate',
  generateDisabled = false,
  promptPlaceholder = 'Describe what you want to create...',
  controlsPanel,
  hidePrompt = false,
  hideSourceMedia = false,
  sourceMediaLabel = 'Source',
  historyItems = [],
  onHistorySelect,
}: VideoToolLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoKey, setVideoKey] = useState(0);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSourceMediaChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSourceMediaChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!resultVideo) return;
    const link = document.createElement('a');
    link.href = resultVideo;
    link.download = `video-${Date.now()}.mp4`;
    link.target = '_blank';
    link.click();
  };

  const handleClear = () => {
    onSourceMediaChange?.(null);
    setVideoKey(prev => prev + 1);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-primary/20 hover:bg-primary/30"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm">
              <Button variant="ghost" size="icon" className="rounded-full" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleClear} title="Clear">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" title="Help">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" title="History">
                <History className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full" 
                onClick={handleDownload}
                disabled={!resultVideo}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-180px)]">
            {/* Center - Main Canvas */}
            <div className="lg:col-span-8 flex flex-col">
              <Card className="flex-1 glass overflow-hidden relative min-h-[400px]">
                {resultVideo ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4 animate-fade-in">
                    <video 
                      key={videoKey}
                      src={resultVideo} 
                      controls 
                      autoPlay 
                      loop 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-muted-foreground">Processing... {progress}%</p>
                          <Progress value={progress} className="w-48 mt-3" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full canvas-grid flex items-center justify-center">
                    {isProcessing ? (
                      <div className="text-center">
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Processing... {progress}%</p>
                        <Progress value={progress} className="w-48 mt-3 mx-auto" />
                        <p className="text-xs text-muted-foreground/70 mt-3">
                          This may take 2-5 minutes
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`w-20 h-20 rounded-2xl ${iconGradient} flex items-center justify-center mx-auto mb-6`}>
                          {icon}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{title}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          {description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Controls Section */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Description / Prompt */}
                <div className="md:col-span-2 space-y-4">
                  {!hidePrompt && setPrompt && (
                    <div>
                      <span className="font-semibold text-sm mb-2 block">Description</span>
                      <Textarea
                        placeholder={promptPlaceholder}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px] resize-none bg-card/50 border-border/50 text-sm"
                      />
                    </div>
                  )}
                  {controlsPanel}
                </div>

                {/* Source Media */}
                {!hideSourceMedia && onSourceMediaChange && (
                  <div>
                    <span className="font-semibold text-sm mb-2 block">{sourceMediaLabel}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={sourceMediaType === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                    
                    {sourceMedia ? (
                      <div className="relative group">
                        {sourceMediaType === 'video' ? (
                          <video 
                            src={sourceMedia} 
                            className="w-full aspect-video object-cover rounded-lg border border-border/50"
                            muted
                          />
                        ) : (
                          <img 
                            src={sourceMedia} 
                            alt="Source" 
                            className="w-full aspect-square object-cover rounded-lg border border-border/50"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onSourceMediaChange(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-square border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors bg-card/30"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button 
                  onClick={onGenerate}
                  disabled={isProcessing || generateDisabled}
                  className="rounded-full px-10 gradient-primary text-white font-medium text-lg py-6"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      {generateLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Panel - History */}
            <div className="lg:col-span-4 space-y-4">
              {historyItems.length > 0 && (
                <Card className="p-4 glass">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">History</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {historyItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => onHistorySelect?.(item)}
                        className="aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors relative group"
                      >
                        <video 
                          src={item} 
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
