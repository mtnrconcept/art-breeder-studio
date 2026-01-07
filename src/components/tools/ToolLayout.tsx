import { ReactNode, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Trash2, 
  Pause, 
  Play, 
  HelpCircle, 
  History, 
  Download, 
  Plus,
  Loader2,
  Upload,
  ImageIcon,
  Shuffle,
  Maximize2,
  Home,
  RotateCcw
} from 'lucide-react';

interface ToolLayoutProps {
  children?: ReactNode;
  title: string;
  description: string;
  prompt: string;
  setPrompt: (value: string) => void;
  generatedImage: string | null;
  baseImage?: string | null;
  onBaseImageChange?: (image: string | null) => void;
  isGenerating: boolean;
  progress?: number;
  onGenerate: () => void;
  onVary?: () => void;
  onEnhance?: () => void;
  onClear?: () => void;
  showBaseImage?: boolean;
  generateLabel?: string;
  promptPlaceholder?: string;
  historyItems?: string[];
  onHistorySelect?: (item: string) => void;
  controlsPanel?: ReactNode;
  hidePrompt?: boolean;
}

export const ToolLayout = ({
  title,
  description,
  prompt,
  setPrompt,
  generatedImage,
  baseImage,
  onBaseImageChange,
  isGenerating,
  progress = 0,
  onGenerate,
  onVary,
  onEnhance,
  onClear,
  showBaseImage = true,
  generateLabel = 'Generate',
  promptPlaceholder = 'Describe what you want to create...',
  historyItems = [],
  onHistorySelect,
  controlsPanel,
  hidePrompt = false,
}: ToolLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onBaseImageChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBaseImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `creation-${Date.now()}.png`;
    link.click();
  };

  const handleClear = () => {
    onClear?.();
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
          {/* Top Toolbar - Artbreeder style */}
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
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
                disabled={!generatedImage}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-10" /> {/* Spacer for balance */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-180px)]">
            {/* Center - Main Canvas */}
            <div className="lg:col-span-8 flex flex-col">
              <Card className="flex-1 glass overflow-hidden relative min-h-[400px]">
                {generatedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-muted-foreground">Generating... {progress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full canvas-grid flex items-center justify-center">
                    {isGenerating ? (
                      <div className="text-center">
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Generating... {progress}%</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">{title}</p>
                        <p className="text-sm text-muted-foreground/70 mt-2">
                          {description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Description + Base Image Section - Artbreeder style */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Description */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">Description</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {!hidePrompt && (
                    <Textarea
                      placeholder={promptPlaceholder}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] resize-none bg-card/50 border-border/50 text-sm"
                    />
                  )}
                  {controlsPanel}
                </div>

                {/* Base Image */}
                {showBaseImage && (
                  <div>
                    <span className="font-semibold text-sm mb-2 block">Base Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBaseImageUpload}
                      className="hidden"
                    />
                    
                    {baseImage ? (
                      <div className="relative group">
                        <img 
                          src={baseImage} 
                          alt="Base" 
                          className="w-full aspect-square object-cover rounded-lg border border-border/50"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onBaseImageChange?.(null)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-2 right-2 h-6 w-6 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onHistorySelect?.(baseImage)}
                          title="Refresh"
                        >
                          <RotateCcw className="h-3 w-3" />
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

              {/* Action Buttons - Artbreeder style */}
              <div className="flex items-center justify-center gap-3 mt-6">
                {onVary && (
                  <Button 
                    variant="outline" 
                    onClick={onVary}
                    disabled={!generatedImage || isGenerating}
                    className="rounded-full px-6 bg-secondary/50 border-border/50 hover:bg-secondary"
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    Vary
                  </Button>
                )}
                <Button 
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="rounded-full px-8 gradient-primary text-white font-medium"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    generateLabel
                  )}
                </Button>
                {onEnhance && (
                  <Button 
                    variant="outline"
                    onClick={onEnhance}
                    disabled={!generatedImage || isGenerating}
                    className="rounded-full px-6 bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Enhance
                  </Button>
                )}
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
                        className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <img 
                          src={item} 
                          alt={`History ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
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
