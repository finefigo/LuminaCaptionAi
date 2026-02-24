import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  ChevronRight,
  Info,
  AlertCircle,
  Type,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOODS, Mood, CaptionResult } from './types';
import { generateCaption, transformCaption } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood>('Normal');
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleGenerate = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const base64Data = image.split(',')[1];
      const baseCaption = await generateCaption(base64Data, mimeType);
      const enhancedCaption = await transformCaption(baseCaption, selectedMood, temperature);
      
      setResult({
        base: baseCaption,
        enhanced: enhancedCaption,
        mood: selectedMood
      });
    } catch (err) {
      console.error(err);
      setError('Failed to generate caption. Please check your API key and connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoodChange = async (mood: Mood) => {
    setSelectedMood(mood);
    if (result) {
      setIsProcessing(true);
      try {
        const enhanced = await transformCaption(result.base, mood, temperature);
        setResult({ ...result, enhanced, mood });
      } catch (err) {
        setError('Failed to transform caption.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const downloadCaption = () => {
    if (!result) return;
    const text = `Suggested Caption: ${result.base}\nMood-Enhanced (${result.mood}): ${result.enhanced}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caption.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">LuminaCaption <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">API</a>
            <button className="bg-black text-white px-4 py-2 rounded-full text-xs hover:bg-gray-800 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Upload & Preview */}
          <div className="lg:col-span-7 space-y-8">
            <section>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Transform your images into stories.</h2>
              <p className="text-gray-500 max-w-lg">Upload an image and let our AI generate the perfect caption with a touch of emotion.</p>
            </section>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "relative group border-2 border-dashed rounded-3xl transition-all duration-300 overflow-hidden bg-white",
                image ? "border-indigo-200" : "border-gray-200 hover:border-indigo-400"
              )}
            >
              {image ? (
                <div className="relative aspect-video w-full">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-black px-6 py-2 rounded-full font-medium flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <RefreshCw className="w-4 h-4" /> Change
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video w-full flex flex-col items-center justify-center cursor-pointer p-12 text-center"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-indigo-600 w-8 h-8" />
                  </div>
                  <p className="font-semibold text-lg">Drop your image here</p>
                  <p className="text-gray-400 text-sm mt-1">or click to browse from your computer</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Controls */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold">Mood Selection</span>
                </div>
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Step 2 of 3</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodChange(mood)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedMood === mood 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {mood}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Creativity Level</span>
                  </div>
                  <span className="text-sm font-mono text-indigo-600 font-bold">{temperature.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.5" 
                  step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-tighter">
                  <span>Factual</span>
                  <span>Creative</span>
                </div>
              </div>

              <button
                disabled={!image || isProcessing}
                onClick={handleGenerate}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                  !image || isProcessing 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
                )}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Caption
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Results & Info */}
          <div className="lg:col-span-5 space-y-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {result.mood}
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Suggested Caption
                        </h3>
                        <p className="text-lg leading-relaxed text-gray-600 italic">
                          "{result.base}"
                        </p>
                      </div>

                      <div className="pt-8 border-t border-gray-50">
                        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Mood-Enhanced Caption
                        </h3>
                        <p className="text-2xl font-bold leading-tight text-black">
                          {result.enhanced}
                        </p>
                      </div>

                      <button 
                        onClick={downloadCaption}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors pt-4"
                      >
                        <Download className="w-4 h-4" /> Download results
                      </button>
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5" /> AI Insight
                    </h4>
                    <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                      Our system uses a <strong>Vision Transformer (ViT)</strong> to analyze your image. It breaks the image into patches and uses <strong>Cross-Attention</strong> to map visual features to text tokens.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-mono text-xs">01</div>
                        <div className="text-xs font-medium">Autoregressive Decoding</div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-mono text-xs">02</div>
                        <div className="text-xs font-medium">Beam Search Optimization</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Sparkles className="text-gray-200 w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Ready to generate</h3>
                  <p className="text-gray-400 text-sm max-w-[240px]">
                    Upload an image on the left to see the AI magic happen here.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-black/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">LuminaCaption AI &copy; 2024</span>
          </div>
          <div className="flex gap-8 text-xs font-medium text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

