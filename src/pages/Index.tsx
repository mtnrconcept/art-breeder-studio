import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Palette, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Create Amazing Art with{' '}
              <span className="gradient-text">AI Power</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Generate, blend, and enhance images using state-of-the-art AI. 
              Turn your imagination into stunning visual art.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gradient-primary text-lg h-14 px-8" asChild>
                <Link to="/tools">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Creating
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                <Link to="/explore">
                  Explore Gallery
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful Creative Tools
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to bring your creative vision to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="tool-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Generation</h3>
              <p className="text-muted-foreground">
                Create stunning images from text descriptions using advanced AI models
              </p>
            </div>

            <div className="tool-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Style Transfer</h3>
              <p className="text-muted-foreground">
                Apply artistic styles to your images with precise control
              </p>
            </div>

            <div className="tool-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enhance & Vary</h3>
              <p className="text-muted-foreground">
                Upscale quality and generate variations of your favorite creations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="tool-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <Users className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Join the Community</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Create an account to save your creations, share with others, and explore what the community has made.
              </p>
              <Button size="lg" className="gradient-primary" asChild>
                <Link to="/auth?mode=signup">
                  Get Started Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-semibold">Artbreeder</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Artbreeder Clone. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
