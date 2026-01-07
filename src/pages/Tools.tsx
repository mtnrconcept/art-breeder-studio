import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import {
  Layers, Palette, User, Wand2, Sparkles, Shapes,
  Image, Paintbrush, ZoomIn, Edit3, Video, Camera,
  FastForward, Film, Eraser, ImageIcon, Sun, Lightbulb,
  Mic, Volume2, Shirt, UserCircle, Heart, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const toolCategories = [
  {
    id: 'classic',
    name: 'Classic Tools',
    description: 'Original Artbreeder tools',
    tools: [
      { id: 'composer', title: 'Composer', description: 'Create images from scratch using text prompts with Style, Face, and Content controls.', icon: Layers, color: 'from-violet-500 to-purple-600', href: '/composer' },
      { id: 'splicer', title: 'Splicer', description: 'Blend multiple images together to create unique hybrid artworks.', icon: Shapes, color: 'from-blue-500 to-cyan-500', href: '/splicer' },
      { id: 'portraits', title: 'Portraits', description: 'Generate and modify realistic human portraits with fine-grained control.', icon: User, color: 'from-pink-500 to-rose-500', href: '/portraits' },
      { id: 'patterns', title: 'Patterns', description: 'Create seamless patterns and textures for design projects.', icon: Palette, color: 'from-amber-500 to-orange-500', href: '/patterns' },
      { id: 'outpainter', title: 'Outpainter', description: 'Extend images beyond their original borders using AI.', icon: Wand2, color: 'from-emerald-500 to-teal-500', href: '/outpainter' },
      { id: 'tuner', title: 'Tuner', description: 'Fine-tune and enhance existing images with AI adjustments.', icon: Sparkles, color: 'from-indigo-500 to-violet-500', href: '/tuner' },
    ]
  },
  {
    id: 'image-gen',
    name: 'Image Generation',
    description: 'Create and transform images with AI',
    tools: [
      { id: 'text-to-image', title: 'Text to Image', description: 'Generate stunning images from text descriptions with multiple styles.', icon: Image, color: 'from-purple-500 to-pink-500', href: '/text-to-image' },
      { id: 'image-inpaint', title: 'Draw to Edit', description: 'Paint over areas to replace with AI-generated content.', icon: Paintbrush, color: 'from-pink-500 to-rose-500', href: '/image-inpaint' },
      { id: 'image-upscale', title: 'Image Upscale', description: 'Enhance resolution up to 8K with AI detail recovery.', icon: ZoomIn, color: 'from-emerald-500 to-green-500', href: '/image-upscale' },
      { id: 'style-transfer', title: 'Style Transfer', description: 'Apply artistic styles from famous painters to modern aesthetics.', icon: Palette, color: 'from-violet-500 to-purple-500', href: '/style-transfer' },
      { id: 'generative-edit', title: 'Generative Edit', description: 'Edit images with natural language - add, remove, or modify anything.', icon: Edit3, color: 'from-orange-500 to-amber-500', href: '/generative-edit' },
    ]
  },
  {
    id: 'video-gen',
    name: 'Video Generation',
    description: 'Create videos from text, images, and more',
    tools: [
      { id: 'text-to-video', title: 'Text to Video', description: 'Transform descriptions into cinematic videos with camera control.', icon: Video, color: 'from-blue-500 to-indigo-500', href: '/text-to-video' },
      { id: 'image-to-video', title: 'Image to Video', description: 'Bring images to life with natural motion and animation.', icon: Camera, color: 'from-cyan-500 to-teal-500', href: '/image-to-video' },
      { id: 'multi-image-video', title: 'Multi-Image Video', description: 'Combine multiple reference images into one cohesive video.', icon: Layers, color: 'from-purple-500 to-violet-500', href: '/multi-image-video' },
      { id: 'video-extension', title: 'Video Extension', description: 'Seamlessly extend videos forward or backward up to 3 minutes.', icon: FastForward, color: 'from-green-500 to-emerald-500', href: '/video-extension' },
      { id: 'video-upscale', title: 'Video Upscale', description: 'Enhance to 8K resolution and interpolate frames to 120fps.', icon: Film, color: 'from-amber-500 to-yellow-500', href: '/video-upscale' },
    ]
  },
  {
    id: 'video-edit',
    name: 'Video Editing',
    description: 'Transform and enhance existing videos',
    tools: [
      { id: 'remove-from-video', title: 'Remove from Video', description: 'Remove any object, person, or element from videos.', icon: Eraser, color: 'from-red-500 to-rose-500', href: '/remove-from-video' },
      { id: 'change-backdrop', title: 'Change Backdrop', description: 'Replace video backgrounds with any setting instantly.', icon: ImageIcon, color: 'from-teal-500 to-cyan-500', href: '/change-backdrop' },
      { id: 'change-time-of-day', title: 'Time of Day', description: 'Transform lighting from dawn to dusk in any video.', icon: Sun, color: 'from-amber-500 to-orange-500', href: '/change-time-of-day' },
      { id: 'relight-scene', title: 'Relight Scene', description: 'Change lighting direction, color, and intensity.', icon: Lightbulb, color: 'from-yellow-500 to-amber-500', href: '/relight-scene' },
    ]
  },
  {
    id: 'audio-avatar',
    name: 'Audio & Avatar',
    description: 'Create talking heads and audio content',
    tools: [
      { id: 'lip-sync', title: 'Lip Sync Studio', description: 'Sync any portrait to speech with natural lip movements.', icon: Mic, color: 'from-pink-500 to-fuchsia-500', href: '/lip-sync-studio' },
      { id: 'talking-avatar', title: 'Talking Avatar', description: 'Create AI presenters that speak your script.', icon: User, color: 'from-indigo-500 to-blue-500', href: '/talking-avatar' },
      { id: 'sound-effects', title: 'Sound Effects', description: 'Generate audio from text or automatically match to video.', icon: Volume2, color: 'from-violet-500 to-purple-500', href: '/sound-effects' },
    ]
  },
  {
    id: 'special',
    name: 'Special Features',
    description: 'Advanced AI capabilities',
    tools: [
      { id: 'virtual-try-on', title: 'Virtual Try-On', description: 'See how any clothing looks on any model instantly.', icon: Shirt, color: 'from-rose-500 to-pink-500', href: '/virtual-try-on' },
      { id: 'fashion-factory', title: 'Fashion Factory', description: 'Generate professional product shots with AI models.', icon: Camera, color: 'from-fuchsia-500 to-pink-500', href: '/fashion-factory' },
      { id: 'soul-id', title: 'Soul ID', description: 'Maintain character consistency across all generations.', icon: UserCircle, color: 'from-blue-500 to-cyan-500', href: '/soul-id' },
      { id: 'video-effects', title: 'Video Effects', description: 'Create interactions between characters from static images.', icon: Heart, color: 'from-pink-500 to-rose-500', href: '/video-effects' },
    ]
  },
];

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = toolCategories.map(category => ({
    ...category,
    tools: category.tools.filter(tool =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category =>
    (!activeCategory || category.id === activeCategory) && category.tools.length > 0
  );

  const totalTools = toolCategories.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">AI Creative Suite</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {totalTools} powerful AI tools for image generation, video creation, and more
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
            >
              All Tools
            </button>
            {toolCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Tools by Category */}
          {filteredCategories.map((category) => (
            <div key={category.id} className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.id} to={tool.href} className="tool-card group p-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Start Creating
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tools found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tools;
