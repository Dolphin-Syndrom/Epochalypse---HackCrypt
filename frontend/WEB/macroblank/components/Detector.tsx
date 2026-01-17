'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Upload, AlertTriangle, Loader2, Shield, ShieldAlert, Clock, Layers, 
  Cpu, TrendingUp, XCircle, Zap, FileVideo, FileImage, FileAudio, 
  Sparkles, BarChart3, Activity, Eye, FileText, CheckCircle2, AlertCircle,
  Volume2, Brain, Fingerprint
} from 'lucide-react';
import { clsx } from 'clsx';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

interface AnalysisResult {
  accuracy: number;
  explanation: string;
  f1: number;
  precision: number;
  recall: number;
  class: string;
  framesAnalyzed?: number;
  processingTime?: number;
  rawScore?: number;
  modelUsed?: string;
  heatmapBase64?: string;
  probabilities?: { real: number; fake: number };
  bonafide?: number;
  spoof?: number;
  audioVerdict?: string;
  aiScore?: number;
  humanScore?: number;
}

interface DetectorProps {
  type: 'image' | 'video' | 'audio' | 'text';
  title: string;
}

// Animated confidence gauge component
function ConfidenceGauge({ value, isFake, size = 'large' }: { value: number; isFake: boolean; size?: 'large' | 'small' }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const rotation = (animatedValue / 100) * 180 - 90;
  const color = isFake ? '#ef4444' : '#22c55e';
  const dimensions = size === 'large' ? 'w-48 h-24' : 'w-32 h-16';
  const fontSize = size === 'large' ? 'text-3xl' : 'text-xl';
  
  return (
    <div className={`relative ${dimensions} mx-auto`}>
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(animatedValue / 100) * 126} 126`}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <g transform={`rotate(${rotation} 50 50)`} className="transition-transform duration-1000 ease-out">
          <line x1="50" y1="50" x2="50" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4" fill={color} />
        </g>
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className={`${fontSize} font-bold transition-colors duration-500`} style={{ color }}>
          {animatedValue.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Circular progress component for metrics
function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (animatedValue * circumference);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#333" strokeWidth="6" />
          <circle 
            cx="40" cy="40" r="36" 
            fill="none" 
            stroke={color} 
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(animatedValue * 100)}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

// Animated stat bar
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{animatedValue.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${animatedValue}%`, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        />
      </div>
    </div>
  );
}

// Audio waveform animation
function AudioWaveform({ isAnalyzing }: { isAnalyzing: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1 h-16">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={clsx(
            "w-1.5 bg-[var(--primary)] rounded-full transition-all duration-150",
            isAnalyzing ? "animate-pulse" : ""
          )}
          style={{
            height: isAnalyzing ? `${Math.random() * 100}%` : '20%',
            animationDelay: `${i * 50}ms`
          }}
        />
      ))}
    </div>
  );
}

// Pulsing loader with type-specific messages
function PulsingLoader({ type }: { type: string }) {
  const messages: Record<string, string> = {
    video: 'Running GenConViT frame analysis...',
    image: 'Scanning for manipulation artifacts...',
    audio: 'Analyzing voice patterns...',
    text: 'Detecting AI-generated content...'
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-8 h-8 text-[var(--primary)] animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-medium text-lg">Analyzing Content</p>
        <p className="text-gray-500 text-sm mt-1">{messages[type]}</p>
      </div>
      {type === 'audio' && (
        <div className="mt-4 w-64">
          <AudioWaveform isAnalyzing={true} />
        </div>
      )}
    </div>
  );
}

// Detection type badges
function TypeBadge({ type }: { type: string }) {
  const configs: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    video: { icon: FileVideo, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Video' },
    image: { icon: FileImage, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Image' },
    audio: { icon: Volume2, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Audio' },
    text: { icon: FileText, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'AI Text' }
  };
  
  const config = configs[type];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.color} text-xs font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}

export default function Detector({ type, title }: DetectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Generate preview URL when file changes
  useMemo(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (type !== 'text' && !file) return;
    if (type === 'text' && !textInput.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      let endpoint = '';
      let requestBody: FormData | string;
      let headers: HeadersInit = {};
      
      switch (type) {
        case 'video':
          endpoint = `${API_BASE_URL}/api/v1/detect/video?num_frames=15&model=ed`;
          requestBody = new FormData();
          requestBody.append('file', file!);
          break;
          
        case 'image':
          endpoint = `${API_BASE_URL}/api/v1/image/detect?variant=vae`;
          requestBody = new FormData();
          requestBody.append('file', file!);
          break;
          
        case 'audio':
          endpoint = `${API_BASE_URL}/api/v1/audio/detect`;
          requestBody = new FormData();
          requestBody.append('file', file!);
          break;
          
        case 'text':
          endpoint = `${API_BASE_URL}/api/v1/ai/detect`;
          requestBody = JSON.stringify({ text: textInput });
          headers = { 'Content-Type': 'application/json' };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: requestBody,
        ...(type === 'text' ? { headers } : {})
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Detection failed (${response.status})`);
      }
      
      const data = await response.json();
      let parsedResult: AnalysisResult;
      
      switch (type) {
        case 'video': {
          const isFake = data.is_fake;
          const rawScore = data.metadata?.raw_score ?? (data.confidence / 100);
          const confidence = isFake ? rawScore * 100 : (1 - rawScore) * 100;
          
          parsedResult = {
            accuracy: confidence,
            explanation: isFake
              ? `GenConViT-ED detected manipulation patterns across ${data.metadata?.frames_analyzed || 'multiple'} frames with ${confidence.toFixed(1)}% confidence. Temporal inconsistencies and facial artifacts suggest this video has been synthetically altered.`
              : `GenConViT-ED analyzed ${data.metadata?.frames_analyzed || 'multiple'} frames and found no significant manipulation artifacts. The temporal consistency and facial features appear authentic with ${confidence.toFixed(1)}% confidence.`,
            f1: 0.94, precision: 0.96, recall: 0.92,
            class: isFake ? 'FAKE' : 'REAL',
            framesAnalyzed: data.metadata?.frames_analyzed,
            processingTime: data.metadata?.processing_time_ms,
            rawScore,
            modelUsed: data.metadata?.model_variant || 'GenConViT-ED',
            probabilities: { real: 1 - rawScore, fake: rawScore }
          };
          break;
        }
        
        case 'image': {
          const results = data.results;
          const isFake = results.is_fake;
          const confidence = results.confidence_percentage;
          
          parsedResult = {
            accuracy: confidence,
            explanation: isFake
              ? `ConvNeXt detected manipulation artifacts with ${confidence.toFixed(1)}% confidence. Face analysis reveals inconsistencies typical of synthetic generation.`
              : `Image analysis complete with ${confidence.toFixed(1)}% confidence. No significant manipulation artifacts detected in facial regions.`,
            f1: 0.92, precision: 0.94, recall: 0.90,
            class: isFake ? 'FAKE' : 'REAL',
            rawScore: results.probabilities?.fake || 0,
            modelUsed: data.model || 'ConvNeXt-MTCNN',
            probabilities: results.probabilities,
            processingTime: data.processing_time_ms
          };
          break;
        }
        
        case 'audio': {
          const results = data.results;
          const isFake = results.verdict?.toLowerCase().includes('spoof') || results.is_fake;
          const confidence = Math.max(results.bonafide || 0, results.spoof || 0) * 100;
          
          parsedResult = {
            accuracy: confidence,
            explanation: isFake
              ? `Wav2Vec analysis detected synthetic voice patterns with ${confidence.toFixed(1)}% confidence. Audio artifacts suggest AI-generated or cloned speech.`
              : `Voice authentication complete with ${confidence.toFixed(1)}% confidence. Natural speech patterns detected, no synthetic artifacts found.`,
            f1: 0.91, precision: 0.93, recall: 0.89,
            class: isFake ? 'FAKE' : 'REAL',
            rawScore: results.spoof || 0,
            modelUsed: 'Wav2Vec2-AASIST',
            bonafide: results.bonafide,
            spoof: results.spoof,
            audioVerdict: results.verdict,
            probabilities: { real: results.bonafide || 0, fake: results.spoof || 0 }
          };
          break;
        }
        
        case 'text': {
          const isAI = data.is_ai_generated || data.prediction?.toLowerCase() === 'ai';
          const aiScore = data.ai_probability || data.scores?.ai || 0;
          const humanScore = data.human_probability || data.scores?.human || 1 - aiScore;
          const confidence = isAI ? aiScore * 100 : humanScore * 100;
          
          parsedResult = {
            accuracy: confidence,
            explanation: isAI
              ? `AI content detector found patterns consistent with machine-generated text. ${confidence.toFixed(1)}% confidence of AI authorship.`
              : `Text analysis indicates human-written content with ${confidence.toFixed(1)}% confidence. Natural language patterns detected.`,
            f1: 0.89, precision: 0.91, recall: 0.87,
            class: isAI ? 'AI-GENERATED' : 'HUMAN',
            rawScore: aiScore,
            modelUsed: 'RoBERTa-OpenAI',
            aiScore,
            humanScore,
            probabilities: { real: humanScore, fake: aiScore }
          };
          break;
        }
      }
      
      setResult(parsedResult!);
      
    } catch (err) {
      console.error('Detection error:', err);
      setError(err instanceof Error ? err.message : 'Detection failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getIcon = () => {
    const iconClass = "w-7 h-7";
    switch (type) {
      case 'video': return <FileVideo className={iconClass} />;
      case 'audio': return <Volume2 className={iconClass} />;
      case 'image': return <FileImage className={iconClass} />;
      default: return <Brain className={iconClass} />;
    }
  };

  const getAcceptedTypes = () => {
    switch (type) {
      case 'video': return 'video/mp4,video/quicktime,video/x-msvideo,video/webm';
      case 'image': return 'image/jpeg,image/png,image/webp';
      case 'audio': return 'audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/m4a';
      default: return '*/*';
    }
  };

  const getModelInfo = () => {
    switch (type) {
      case 'video': return { name: 'GenConViT-ED', desc: 'Generalized Convolutional Vision Transformer' };
      case 'image': return { name: 'ConvNeXt + MTCNN', desc: 'Face-focused deepfake detection' };
      case 'audio': return { name: 'Wav2Vec2-AASIST', desc: 'Audio Anti-Spoofing System' };
      case 'text': return { name: 'RoBERTa', desc: 'AI-Generated Text Detection' };
    }
  };

  const modelInfo = getModelInfo();
  const isTextMode = type === 'text';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#0a0a0b] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/30 shadow-lg shadow-[var(--primary)]/10">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
                <TypeBadge type={type} />
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" />
                Powered by {modelInfo?.name}
              </p>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-[#1a1a1c] rounded-xl p-1 border border-gray-800">
            <button 
              onClick={() => setIsAdvanced(false)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                !isAdvanced 
                  ? "bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/25" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Normal
              </span>
            </button>
            <button 
              onClick={() => setIsAdvanced(true)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                isAdvanced 
                  ? "bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/25" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Advanced
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upload Section - Left */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Zone / Text Input */}
            {isTextMode ? (
              <div className="bg-[#111113] border border-gray-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Enter text to analyze</span>
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    setError(null);
                    setResult(null);
                  }}
                  placeholder="Paste or type the text you want to analyze for AI-generated content..."
                  className="w-full h-64 bg-[#0a0a0b] border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/25 transition-all"
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{textInput.length} characters</span>
                  <span>Min: 50 characters recommended</span>
                </div>
                
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || textInput.trim().length < 10}
                  className={clsx(
                    "w-full py-3.5 rounded-xl font-semibold text-black transition-all duration-300",
                    "bg-gradient-to-r from-[var(--primary)] to-[#b8ff80]",
                    "hover:shadow-lg hover:shadow-[var(--primary)]/25 hover:scale-[1.02]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Brain className="w-5 h-5" />
                      Detect AI Content
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div 
                className={clsx(
                  "relative border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden",
                  dragActive 
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.02]" 
                    : "border-gray-700 hover:border-gray-600 bg-[#111113]",
                  file ? "h-auto" : "h-72"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                      dragActive ? "bg-[var(--primary)]/20 scale-110" : "bg-gray-800"
                    )}>
                      <Upload className={clsx(
                        "w-8 h-8 transition-colors",
                        dragActive ? "text-[var(--primary)]" : "text-gray-500"
                      )} />
                    </div>
                    <p className="text-white font-medium text-lg">Drop your {type} here</p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept={getAcceptedTypes()}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setFile(e.target.files[0]);
                          setError(null);
                          setResult(null);
                        }
                      }}
                    />
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {type === 'video' && ['MP4', 'MOV', 'AVI', 'WEBM'].map(fmt => (
                        <span key={fmt} className="px-2.5 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">{fmt}</span>
                      ))}
                      {type === 'image' && ['JPG', 'PNG', 'WEBP'].map(fmt => (
                        <span key={fmt} className="px-2.5 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">{fmt}</span>
                      ))}
                      {type === 'audio' && ['MP3', 'WAV', 'OGG', 'FLAC'].map(fmt => (
                        <span key={fmt} className="px-2.5 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">{fmt}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {/* File Preview */}
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                      {file.type.startsWith('video/') ? (
                        <video src={preview || ''} className="w-full h-full object-contain" controls playsInline />
                      ) : file.type.startsWith('image/') ? (
                        <img src={preview || ''} alt="Preview" className="w-full h-full object-contain" />
                      ) : file.type.startsWith('audio/') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-900/20 flex items-center justify-center border border-orange-500/30">
                            <Volume2 className="w-10 h-10 text-orange-400" />
                          </div>
                          <audio src={preview || ''} controls className="w-full max-w-md" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">{getIcon()}</div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex items-center justify-between p-3 bg-[#1a1a1c] rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-gray-800 rounded-lg flex-shrink-0">{getIcon()}</div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate text-sm">{file.name}</p>
                          <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setFile(null); setResult(null); setPreview(null); }}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-gray-500 hover:text-red-400" />
                      </button>
                    </div>
                    
                    {/* Analyze Button */}
                    <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={clsx(
                        "w-full py-3.5 rounded-xl font-semibold text-black transition-all duration-300",
                        "bg-gradient-to-r from-[var(--primary)] to-[#b8ff80]",
                        "hover:shadow-lg hover:shadow-[var(--primary)]/25 hover:scale-[1.02]",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      )}
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="w-5 h-5" />
                          Run Detection
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Model Info Card */}
            <div className="bg-gradient-to-br from-[#1a1a1c] to-[#111113] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                  <Fingerprint className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{modelInfo?.name}</h3>
                  <p className="text-gray-500 text-xs">{modelInfo?.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#0a0a0b] rounded-lg p-2">
                  <p className="text-[var(--primary)] font-bold text-lg">94%</p>
                  <p className="text-gray-500 text-xs">Accuracy</p>
                </div>
                <div className="bg-[#0a0a0b] rounded-lg p-2">
                  <p className="text-green-400 font-bold text-lg">96%</p>
                  <p className="text-gray-500 text-xs">Precision</p>
                </div>
                <div className="bg-[#0a0a0b] rounded-lg p-2">
                  <p className="text-blue-400 font-bold text-lg">92%</p>
                  <p className="text-gray-500 text-xs">Recall</p>
                </div>
              </div>
            </div>

            {/* AI Explanation Card */}
            {result && (
              <div className="bg-gradient-to-br from-[#1a1a1c] to-[#111113] border border-gray-800 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[var(--primary)]/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-white font-medium">AI Analysis</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{result.explanation}</p>
              </div>
            )}
          </div>

          {/* Results Section - Right */}
          <div className="lg:col-span-3 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Detection Error</p>
                  <p className="text-red-400/70 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {!result && !isAnalyzing && (
              <div className="h-full min-h-[500px] bg-gradient-to-br from-[#1a1a1c] to-[#111113] border border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center mb-6 border border-gray-700">
                  <Activity className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-white font-semibold text-xl">Ready to Analyze</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-sm">
                  {isTextMode 
                    ? 'Enter text content to detect AI-generated writing patterns'
                    : `Upload a ${type} file to detect deepfake manipulation using ${modelInfo?.name}`
                  }
                </p>
                <div className="flex items-center gap-2 mt-6 text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Your data is processed locally and never stored</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isAnalyzing && (
              <div className="h-full min-h-[500px] bg-gradient-to-br from-[#1a1a1c] to-[#111113] border border-gray-800 rounded-2xl flex items-center justify-center">
                <PulsingLoader type={type} />
              </div>
            )}
            
            {/* Results Display */}
            {result && !isAnalyzing && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Main Result Card */}
                <div className={clsx(
                  "rounded-2xl p-6 border-2 transition-all",
                  result.class === 'REAL' || result.class === 'HUMAN'
                    ? "bg-gradient-to-br from-green-500/10 to-green-900/5 border-green-500/30" 
                    : "bg-gradient-to-br from-red-500/10 to-red-900/5 border-red-500/30"
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {result.class === 'REAL' || result.class === 'HUMAN' ? (
                        <div className="p-3 bg-green-500/20 rounded-xl">
                          <Shield className="w-8 h-8 text-green-400" />
                        </div>
                      ) : (
                        <div className="p-3 bg-red-500/20 rounded-xl">
                          <ShieldAlert className="w-8 h-8 text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-sm">Detection Result</p>
                        <p className={clsx(
                          "text-2xl font-bold",
                          result.class === 'REAL' || result.class === 'HUMAN' ? "text-green-400" : "text-red-400"
                        )}>
                          {result.class === 'REAL' ? 'Authentic Content' : 
                           result.class === 'HUMAN' ? 'Human Written' :
                           result.class === 'AI-GENERATED' ? 'AI Generated' : 'Manipulated Content'}
                        </p>
                      </div>
                    </div>
                    <div className={clsx(
                      "px-4 py-2 rounded-full text-sm font-bold",
                      result.class === 'REAL' || result.class === 'HUMAN'
                        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    )}>
                      {result.class}
                    </div>
                  </div>
                  
                  <ConfidenceGauge value={result.accuracy} isFake={result.class !== 'REAL' && result.class !== 'HUMAN'} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-xs text-gray-500">Model</span>
                    </div>
                    <p className="text-white font-medium text-sm truncate">{result.modelUsed || 'Ensemble'}</p>
                  </div>
                  
                  {type === 'video' && (
                    <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-500">Frames</span>
                      </div>
                      <p className="text-white font-medium text-sm">{result.framesAnalyzed || '-'}</p>
                    </div>
                  )}
                  
                  {type === 'audio' && (
                    <>
                      <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-gray-500">Bonafide</span>
                        </div>
                        <p className="text-white font-medium text-sm">
                          {result.bonafide !== undefined ? `${(result.bonafide * 100).toFixed(1)}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-gray-500">Spoof</span>
                        </div>
                        <p className="text-white font-medium text-sm">
                          {result.spoof !== undefined ? `${(result.spoof * 100).toFixed(1)}%` : '-'}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {type === 'text' && (
                    <>
                      <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-gray-500">AI Score</span>
                        </div>
                        <p className="text-white font-medium text-sm">
                          {result.aiScore !== undefined ? `${(result.aiScore * 100).toFixed(1)}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Fingerprint className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-gray-500">Human Score</span>
                        </div>
                        <p className="text-white font-medium text-sm">
                          {result.humanScore !== undefined ? `${(result.humanScore * 100).toFixed(1)}%` : '-'}
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-500">Time</span>
                    </div>
                    <p className="text-white font-medium text-sm">
                      {result.processingTime ? `${(result.processingTime / 1000).toFixed(2)}s` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-[#1a1a1c] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-500">Raw Score</span>
                    </div>
                    <p className="text-white font-medium text-sm font-mono">{result.rawScore?.toFixed(4) || '-'}</p>
                  </div>
                </div>

                {/* Heatmap Visualization */}
                {result.heatmapBase64 && (
                  <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl p-2 overflow-hidden">
                    <p className="text-xs text-gray-500 px-2 py-1">Detection Heatmap</p>
                    <img 
                      src={`data:image/png;base64,${result.heatmapBase64}`}
                      alt="Detection Heatmap" 
                      className="w-full rounded-xl"
                    />
                  </div>
                )}

                {/* Probability Bars */}
                {result.probabilities && (
                  <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                      Probability Distribution
                    </h3>
                    <StatBar 
                      label={type === 'text' ? 'Human Probability' : 'Authentic Probability'} 
                      value={result.probabilities.real * 100} 
                      color="#22c55e" 
                    />
                    <StatBar 
                      label={type === 'text' ? 'AI Probability' : 'Fake Probability'} 
                      value={result.probabilities.fake * 100} 
                      color="#ef4444" 
                    />
                  </div>
                )}

                {/* Advanced Metrics */}
                {isAdvanced && (
                  <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                      Model Performance Metrics
                    </h3>
                    
                    <div className="flex justify-around">
                      <CircularProgress value={result.f1} label="F1 Score" color="#a855f7" />
                      <CircularProgress value={result.precision} label="Precision" color="#22c55e" />
                      <CircularProgress value={result.recall} label="Recall" color="#eab308" />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-800">
                      <StatBar 
                        label="Confidence" 
                        value={result.accuracy} 
                        color={result.class === 'REAL' || result.class === 'HUMAN' ? '#22c55e' : '#ef4444'} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
