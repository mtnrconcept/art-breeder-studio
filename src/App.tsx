import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tools from "./pages/Tools";
import Composer from "./pages/Composer";
import Splicer from "./pages/Splicer";
import Portraits from "./pages/Portraits";
import Patterns from "./pages/Patterns";
import Outpainter from "./pages/Outpainter";
import Tuner from "./pages/Tuner";
import Gallery from "./pages/Gallery";
import Explore from "./pages/Explore";
import TextToVideo from "./pages/TextToVideo";
import ImageToVideo from "./pages/ImageToVideo";
import LipSync from "./pages/LipSync";
import BackgroundRemover from "./pages/BackgroundRemover";
import Upscaler from "./pages/Upscaler";
import Inpainter from "./pages/Inpainter";
import VirtualTryOn from "./pages/VirtualTryOn";
import SoundGenerator from "./pages/SoundGenerator";
import VideoEffects from "./pages/VideoEffects";
import VideoExtend from "./pages/VideoExtend";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/composer" element={<Composer />} />
            <Route path="/splicer" element={<Splicer />} />
            <Route path="/portraits" element={<Portraits />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/outpainter" element={<Outpainter />} />
            <Route path="/tuner" element={<Tuner />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/text-to-video" element={<TextToVideo />} />
            <Route path="/image-to-video" element={<ImageToVideo />} />
            <Route path="/lip-sync" element={<LipSync />} />
            <Route path="/background-remover" element={<BackgroundRemover />} />
            <Route path="/upscaler" element={<Upscaler />} />
            <Route path="/inpainter" element={<Inpainter />} />
            <Route path="/virtual-tryon" element={<VirtualTryOn />} />
            <Route path="/sound-generator" element={<SoundGenerator />} />
            <Route path="/video-effects" element={<VideoEffects />} />
            <Route path="/video-extend" element={<VideoExtend />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
