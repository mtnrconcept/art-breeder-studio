import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Layers, Palette, User, Wand2, Sparkles, Shapes, Video, Film, Mic, Eraser, ZoomIn, Paintbrush, Shirt, Music, Camera, Plus } from 'lucide-react';

const imageTools = [
  { id: 'composer', title: 'Composer', description: 'Créez des images à partir de prompts textuels avec contrôles Style, Visage et Contenu.', icon: Layers, color: 'from-violet-500 to-purple-600', href: '/composer' },
  { id: 'splicer', title: 'Splicer', description: 'Mélangez plusieurs images pour créer des œuvres hybrides uniques.', icon: Shapes, color: 'from-blue-500 to-cyan-500', href: '/splicer' },
  { id: 'portraits', title: 'Portraits', description: 'Générez et modifiez des portraits humains réalistes.', icon: User, color: 'from-pink-500 to-rose-500', href: '/portraits' },
  { id: 'patterns', title: 'Patterns', description: 'Créez des motifs et textures sans couture pour vos designs.', icon: Palette, color: 'from-amber-500 to-orange-500', href: '/patterns' },
  { id: 'outpainter', title: 'Outpainter', description: 'Étendez vos images au-delà de leurs bordures originales.', icon: Wand2, color: 'from-emerald-500 to-teal-500', href: '/outpainter' },
  { id: 'tuner', title: 'Mixer', description: 'Mélangez et affinez des images existantes avec des ajustements IA.', icon: Sparkles, color: 'from-indigo-500 to-violet-500', href: '/tuner' },
  { id: 'background-remover', title: 'Remove Background', description: 'Supprimez automatiquement le fond de vos images.', icon: Eraser, color: 'from-red-500 to-orange-500', href: '/background-remover' },
  { id: 'upscaler', title: 'Upscaler', description: 'Augmentez la résolution de vos images avec l\'IA.', icon: ZoomIn, color: 'from-green-500 to-emerald-500', href: '/upscaler' },
  { id: 'inpainter', title: 'Inpainter', description: 'Peignez une zone et remplacez-la par ce que vous décrivez.', icon: Paintbrush, color: 'from-purple-500 to-indigo-500', href: '/inpainter' },
  { id: 'virtual-tryon', title: 'Virtual Try-On', description: 'Essayez virtuellement des vêtements sur une photo.', icon: Shirt, color: 'from-fuchsia-500 to-pink-500', href: '/virtual-tryon' },
];

const videoTools = [
  { id: 'text-to-video', title: 'Text to Video', description: 'Générez des vidéos à partir de descriptions textuelles avec Kling, Minimax ou Veo3.', icon: Video, color: 'from-violet-500 to-purple-600', href: '/text-to-video' },
  { id: 'image-to-video', title: 'Image to Video', description: 'Animez vos images en vidéos fluides avec l\'IA.', icon: Film, color: 'from-blue-500 to-cyan-500', href: '/image-to-video' },
  { id: 'lip-sync', title: 'Lip Sync', description: 'Créez des avatars parlants réalistes à partir d\'une image.', icon: Mic, color: 'from-pink-500 to-rose-500', href: '/lip-sync' },
  { id: 'video-effects', title: 'Video Effects', description: 'Appliquez des effets cinématiques : mouvement de caméra, style, profondeur.', icon: Camera, color: 'from-cyan-500 to-blue-500', href: '/video-effects' },
  { id: 'video-extend', title: 'Video Extend', description: 'Prolongez vos vidéos en décrivant ce qui doit se passer ensuite.', icon: Plus, color: 'from-teal-500 to-emerald-500', href: '/video-extend' },
];

const audioTools = [
  { id: 'sound-generator', title: 'Sound Generator', description: 'Générez des effets sonores, de la musique ou de la parole avec l\'IA.', icon: Music, color: 'from-yellow-500 to-orange-500', href: '/sound-generator' },
];

const ToolCard = ({ tool }: { tool: typeof imageTools[0] }) => {
  const Icon = tool.icon;
  return (
    <Link to={tool.href} className="tool-card group p-6">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">{tool.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{tool.description}</p>
      <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Commencer
        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Creative Tools</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Suite complète d'outils IA pour créer, transformer et animer vos contenus.
            </p>
          </div>

          {/* Image Tools */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Layers className="w-6 h-6" />
              Outils Image
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {imageTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </section>

          {/* Video Tools */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Video className="w-6 h-6" />
              Outils Vidéo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videoTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </section>

          {/* Audio Tools */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Music className="w-6 h-6" />
              Outils Audio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {audioTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Tools;