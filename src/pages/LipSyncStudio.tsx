import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Mic, Wand2, RefreshCw, Download, Play, Volume2 } from 'lucide-react';

const voices = [
    { id: 'sarah', label: 'Sarah', gender: 'Female', accent: 'American' },
    { id: 'james', label: 'James', gender: 'Male', accent: 'British' },
    { id: 'emma', label: 'Emma', gender: 'Female', accent: 'British' },
    { id: 'michael', label: 'Michael', gender: 'Male', accent: 'American' },
    { id: 'sophie', label: 'Sophie', gender: 'Female', accent: 'French' },
    { id: 'alex', label: 'Alex', gender: 'Neutral', accent: 'American' },
];

const LipSyncStudio = () => {
    const [portrait, setPortrait] = useState<string | null>(null);
    const [portraitType, setPortraitType] = useState<'image' | 'video'>('image');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [useText, setUseText] = useState(true);
    const [text, setText] = useState('');
    const [voice, setVoice] = useState('sarah');
    const [expressionIntensity, setExpressionIntensity] = useState([70]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video');
            setPortraitType(isVideo ? 'video' : 'image');
            if (isVideo) {
                setPortrait(URL.createObjectURL(file));
            } else {
                const reader = new FileReader();
                reader.onload = (event) => setPortrait(event.target?.result as string);
                reader.readAsDataURL(file);
            }
            setResult(null);
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setAudioFile(file); setUseText(false); }
    };

    const handleProcess = () => {
        if (!portrait || (!audioFile && !text.trim())) return;
        setIsProcessing(true);
        setTimeout(() => {
            setResult('https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4');
            setIsProcessing(false);
        }, 5000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-500 mb-4">
                            <Mic className="w-4 h-4" />
                            <span className="text-sm font-medium">Audio-Visual Sync</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Lip Sync Studio</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Sync any portrait to speech with natural lip movements and expressions</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Portrait (Image or Video)</label>
                                <label className="block cursor-pointer">
                                    <input type="file" accept="image/*,video/*" onChange={handlePortraitUpload} className="hidden" />
                                    {portrait ? (
                                        <div className="aspect-square rounded-lg overflow-hidden bg-black">
                                            {portraitType === 'video' ? <video src={portrait} className="w-full h-full object-cover" muted /> : <img src={portrait} className="w-full h-full object-cover" />}
                                        </div>
                                    ) : (
                                        <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload portrait</span></div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="tool-card p-4">
                                <div className="flex gap-2 mb-4">
                                    <Button variant={useText ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setUseText(true)}>Text to Speech</Button>
                                    <Button variant={!useText ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setUseText(false)}>Upload Audio</Button>
                                </div>

                                {useText ? (
                                    <>
                                        <Textarea placeholder="Enter text to speak..." value={text} onChange={(e) => setText(e.target.value)} className="min-h-[100px] resize-none mb-3" />
                                        <Select value={voice} onValueChange={setVoice}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {voices.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>{v.label} ({v.gender}, {v.accent})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                ) : (
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                                        <div className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors text-center">
                                            <Volume2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">{audioFile ? audioFile.name : 'Upload audio file'}</span>
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Expression Intensity</label>
                                    <span className="text-sm text-muted-foreground">{expressionIntensity[0]}%</span>
                                </div>
                                <Slider value={expressionIntensity} onValueChange={setExpressionIntensity} min={0} max={100} />
                            </div>

                            <Button onClick={handleProcess} disabled={!portrait || (!audioFile && !text.trim()) || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Wand2 className="w-5 h-5 mr-2" />Generate Lip Sync</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? <video src={result} className="w-full h-full object-contain" controls autoPlay />
                                        : portrait ? (
                                            portraitType === 'video' ? <video src={portrait} className="w-full h-full object-contain" controls /> : <img src={portrait} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Mic className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Upload a Portrait</h3></div></div>
                                        )}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-pink-500/20" /><div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Syncing audio to portrait...</p></div>
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

export default LipSyncStudio;
