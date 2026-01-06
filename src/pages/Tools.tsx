import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Layers, Palette, User, Wand2, Sparkles, Shapes } from 'lucide-react';

const tools = [
  {
    id: 'composer',
    title: 'Composer',
    description: 'Create images from scratch using text prompts and base images with Style, Face, and Content controls.',
    icon: Layers,
    color: 'from-violet-500 to-purple-600',
    href: '/composer'
  },
  {
    id: 'splicer',
    title: 'Splicer',
    description: 'Blend multiple images together to create unique hybrid artworks.',
    icon: Shapes,
    color: 'from-blue-500 to-cyan-500',
    href: '/composer'
  },
  {
    id: 'portraits',
    title: 'Portraits',
    description: 'Generate and modify realistic human portraits with fine-grained control.',
    icon: User,
    color: 'from-pink-500 to-rose-500',
    href: '/composer'
  },
  {
    id: 'patterns',
    title: 'Patterns',
    description: 'Create seamless patterns and textures for design projects.',
    icon: Palette,
    color: 'from-amber-500 to-orange-500',
    href: '/composer'
  },
  {
    id: 'outpainter',
    title: 'Outpainter',
    description: 'Extend images beyond their original borders using AI.',
    icon: Wand2,
    color: 'from-emerald-500 to-teal-500',
    href: '/composer'
  },
  {
    id: 'tuner',
    title: 'Tuner',
    description: 'Fine-tune and enhance existing images with AI-powered adjustments.',
    icon: Sparkles,
    color: 'from-indigo-500 to-violet-500',
    href: '/composer'
  }
];

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Creative Tools</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our suite of AI-powered tools to create, blend, and enhance your artwork.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
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
      </main>
    </div>
  );
};

export default Tools;
