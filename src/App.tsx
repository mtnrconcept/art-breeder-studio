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
import NotFound from "./pages/NotFound";

// Image Generation Tools
import TextToImage from "./pages/TextToImage";
import ImageInpaint from "./pages/ImageInpaint";
import ImageUpscale from "./pages/ImageUpscale";
import StyleTransfer from "./pages/StyleTransfer";
import GenerativeEdit from "./pages/GenerativeEdit";

// Video Generation Tools
import TextToVideo from "./pages/TextToVideo";
import ImageToVideo from "./pages/ImageToVideo";
import MultiImageVideo from "./pages/MultiImageVideo";
import VideoExtension from "./pages/VideoExtension";
import VideoUpscale from "./pages/VideoUpscale";

// Video Editing Tools
import RemoveFromVideo from "./pages/RemoveFromVideo";
import ChangeBackdrop from "./pages/ChangeBackdrop";
import ChangeTimeOfDay from "./pages/ChangeTimeOfDay";
import RelightScene from "./pages/RelightScene";

// Audio & Avatar Tools
import LipSyncStudio from "./pages/LipSyncStudio";
import TalkingAvatar from "./pages/TalkingAvatar";
import SoundEffects from "./pages/SoundEffects";

// Special Features
import VirtualTryOn from "./pages/VirtualTryOn";
import FashionFactory from "./pages/FashionFactory";
import SoulID from "./pages/SoulID";
import VideoEffects from "./pages/VideoEffects";

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

            {/* Image Generation Tools */}
            <Route path="/text-to-image" element={<TextToImage />} />
            <Route path="/image-inpaint" element={<ImageInpaint />} />
            <Route path="/image-upscale" element={<ImageUpscale />} />
            <Route path="/style-transfer" element={<StyleTransfer />} />
            <Route path="/generative-edit" element={<GenerativeEdit />} />

            {/* Video Generation Tools */}
            <Route path="/text-to-video" element={<TextToVideo />} />
            <Route path="/image-to-video" element={<ImageToVideo />} />
            <Route path="/multi-image-video" element={<MultiImageVideo />} />
            <Route path="/video-extension" element={<VideoExtension />} />
            <Route path="/video-upscale" element={<VideoUpscale />} />

            {/* Video Editing Tools */}
            <Route path="/remove-from-video" element={<RemoveFromVideo />} />
            <Route path="/change-backdrop" element={<ChangeBackdrop />} />
            <Route path="/change-time-of-day" element={<ChangeTimeOfDay />} />
            <Route path="/relight-scene" element={<RelightScene />} />

            {/* Audio & Avatar Tools */}
            <Route path="/lip-sync-studio" element={<LipSyncStudio />} />
            <Route path="/talking-avatar" element={<TalkingAvatar />} />
            <Route path="/sound-effects" element={<SoundEffects />} />

            {/* Special Features */}
            <Route path="/virtual-try-on" element={<VirtualTryOn />} />
            <Route path="/fashion-factory" element={<FashionFactory />} />
            <Route path="/soul-id" element={<SoulID />} />
            <Route path="/video-effects" element={<VideoEffects />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
