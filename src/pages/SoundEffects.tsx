import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Upload, Volume2, Wand2, RefreshCw, Download, Play, Pause } from 'lucide-react';

const soundCategories = [
    { id: 'ambient', label: 'Ambient', examples: ['forest sounds', 'city traffic', 'ocean waves'] },
    { id: 'effects', label: 'Sound Effects', examples: ['explosion', 'footsteps', 'door slam'] },
    { id: 'music', label: 'Music', examples: ['upbeat electronic', 'calm piano', 'epic orchestra'] },
    { id: 'voice', label: 'Voice', examples: ['crowd chatter', 'whisper', 'announcement'] },
];

const SoundEffects = () => {
    const [mode, setMode] = useState<'text' | 'video'>('text');
    const [video, setVideo] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState([5]);
    const [category, setCategory] = useState('effects');
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioResult, setAudioResult] = useState<string | null>(null);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setVideo(URL.createObjectURL(file)); setMode('video'); }
    };

    const handleGenerate = () => {
        if (mode === 'text' && !prompt.trim()) return;
        if (mode === 'video' && !video) return;
        setIsProcessing(true);
        setTimeout(() => {
            setAudioResult('generated');
            setIsProcessing(false);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-500 mb-4">
                            <Volume2 className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Audio</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Sound Effects</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Generate sound effects from text or automatically match audio to video</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <div className="flex gap-2 mb-4">
                                    <Button variant={mode === 'text' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setMode('text')}>Text to Audio</Button>
                                    <Button variant={mode === 'video' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setMode('video')}>Video to Audio</Button>
                                </div>

                                {mode === 'text' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {soundCategories.map((cat) => (
                                                <button key={cat.id} onClick={() => setCategory(cat.id)}
                                                    className={`p-2 rounded-lg border text-center transition-all ${category === cat.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                                    <span className="text-sm font-medium block">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <Textarea placeholder={`Describe the sound...&#10;e.g., ${soundCategories.find(c => c.id === category)?.examples.join(', ')}`} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[100px] resize-none mb-3" />
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium">Duration</label>
                                                <span className="text-sm text-muted-foreground">{duration[0]}s</span>
                                            </div>
                                            <Slider value={duration} onValueChange={setDuration} min={1} max={30} />
                                        </div>
                                    </>
                                ) : (
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                        {video ? (
                                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                <video src={video} className="w-full h-full object-contain" muted />
                                            </div>
                                        ) : (
                                            <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                                <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload video for automatic audio</span></div>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            <Button onClick={handleGenerate} disabled={isProcessing || (mode === 'text' && !prompt.trim()) || (mode === 'video' && !video)} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Wand2 className="w-5 h-5 mr-2" />Generate Audio</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <h3 className="font-medium mb-4">Generated Audio</h3>
                                <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-violet-900/20 to-violet-600/20 relative flex items-center justify-center">
                                    {audioResult ? (
                                        <div className="text-center p-8">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
                                                <Volume2 className="w-16 h-16 text-white" />
                                            </div>
                                            <p className="text-lg font-medium mb-4">Audio Generated!</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <Button><Play className="w-4 h-4 mr-2" />Play</Button>
                                                <Button variant="outline"><Download className="w-4 h-4 mr-2" />Download</Button>
                                            </div>
                                            <div className="mt-6 w-full h-16 bg-muted/30 rounded-lg flex items-center justify-center gap-1">
                                                {Array.from({ length: 50 }).map((_, i) => (
                                                    <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center"><Volume2 className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">{mode === 'text' ? 'Describe a Sound' : 'Upload a Video'}</h3><p className="text-muted-foreground">AI-generated audio will appear here</p></div>
                                    )}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-violet-500/20" /><div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Generating audio...</p></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SoundEffects;
