import { useState } from 'react';
import { createTalkingAvatar, textToImage, pollVideo } from '@/lib/gemini';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Wand2, RefreshCw, Download, Sparkles } from 'lucide-react';

const avatarStyles = [
    { id: 'realistic', label: 'Photorealistic', preview: '👤' },
    { id: 'cartoon', label: 'Cartoon', preview: '🎨' },
    { id: 'anime', label: 'Anime', preview: '🎌' },
    { id: '3d', label: '3D Stylized', preview: '💎' },
];

const gestures = [
    { id: 'neutral', label: 'Neutral' },
    { id: 'nodding', label: 'Nodding' },
    { id: 'explaining', label: 'Explaining (hand gestures)' },
    { id: 'presenting', label: 'Presenting' },
];

const TalkingAvatar = () => {
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [useGenerated, setUseGenerated] = useState(true);
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [avatarStyle, setAvatarStyle] = useState('realistic');
    const [script, setScript] = useState('');
    const [voice, setVoice] = useState('sarah');
    const [gesture, setGesture] = useState('nodding');
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleGenerateAvatar = async () => {
        if (!avatarPrompt.trim()) return;
        setIsGeneratingAvatar(true);
        try {
            const res = await textToImage(avatarPrompt, { style: avatarStyle });
            if (res.success && res.imageUrl) {
                setAvatarImage(res.imageUrl);
            }
        } catch (e) { console.error(e); }
        finally { setIsGeneratingAvatar(false); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setAvatarImage(event.target?.result as string); setUseGenerated(false); };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = async () => {
        if (!avatarImage || !script.trim()) return;
        setIsProcessing(true);
        try {
            const res = await createTalkingAvatar(avatarImage, script);
            if (res.success && res.operationName) {
                const finalRes = await pollVideo(res.operationName);
                if (finalRes.success && finalRes.videoUrl) {
                    setResult(finalRes.videoUrl);
                }
            }
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 mb-4">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Presenter</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Talking Avatar</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Create AI-powered video presenters that speak your script</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="tool-card p-4">
                                <div className="flex gap-2 mb-4">
                                    <Button variant={useGenerated ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setUseGenerated(true)}>Generate Avatar</Button>
                                    <Button variant={!useGenerated ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setUseGenerated(false)}>Upload Image</Button>
                                </div>

                                {useGenerated ? (
                                    <>
                                        <Textarea placeholder="Describe your avatar...&#10;e.g., Professional woman in her 30s with dark hair" value={avatarPrompt} onChange={(e) => setAvatarPrompt(e.target.value)} className="min-h-[80px] resize-none mb-3" />

                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {avatarStyles.map((style) => (
                                                <button key={style.id} onClick={() => setAvatarStyle(style.id)}
                                                    className={`p-2 rounded-lg border text-center transition-all ${avatarStyle === style.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                                    <span className="text-xl block">{style.preview}</span>
                                                    <span className="text-xs">{style.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <Button onClick={handleGenerateAvatar} disabled={!avatarPrompt.trim() || isGeneratingAvatar} className="w-full">
                                            {isGeneratingAvatar ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Avatar</>}
                                        </Button>
                                    </>
                                ) : (
                                    <label className="block cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                            {avatarImage && !useGenerated ? <img src={avatarImage} className="w-full h-full object-cover rounded-lg" /> : <div className="text-center"><User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload portrait</span></div>}
                                        </div>
                                    </label>
                                )}

                                {avatarImage && useGenerated && (
                                    <div className="mt-3 aspect-square rounded-lg overflow-hidden">
                                        <img src={avatarImage} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Script</label>
                                <Textarea placeholder="What should the avatar say?" value={script} onChange={(e) => setScript(e.target.value)} className="min-h-[120px] resize-none" />
                            </div>

                            <div className="tool-card p-4 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Voice</label>
                                    <Select value={voice} onValueChange={setVoice}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sarah">Sarah (Female, American)</SelectItem>
                                            <SelectItem value="james">James (Male, British)</SelectItem>
                                            <SelectItem value="emma">Emma (Female, British)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Gesture Style</label>
                                    <Select value={gesture} onValueChange={setGesture}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {gestures.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button onClick={handleProcess} disabled={!avatarImage || !script.trim() || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Creating...</> : <><Wand2 className="w-5 h-5 mr-2" />Create Talking Avatar</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {result ? <video src={result} className="w-full h-full object-contain" controls autoPlay />
                                        : avatarImage ? <img src={avatarImage} className="w-full h-full object-contain opacity-50" />
                                            : <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><User className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Create Your Avatar</h3></div></div>}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" /><div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Creating talking avatar...</p></div>
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

export default TalkingAvatar;
