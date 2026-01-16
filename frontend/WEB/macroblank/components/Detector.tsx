'use client';

import { useState } from 'react';
import { Upload, FileVideo, FileAudio, FileImage, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';

interface AnalysisResult {
  accuracy: number;
  gradCamUrl: string;
  explanation: string;
  f1: number;
  precision: number;
  recall: number;
  class: string;
}

interface DetectorProps {
  type: 'image' | 'video' | 'audio' | 'text';
  title: string;
}

export default function Detector({ type, title }: DetectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setResult({
        accuracy: 98.5,
        gradCamUrl: 'https://placehold.co/600x400/1e1e20/FFF?text=GradCAM+Overlay',
        explanation: 'The model detected inconsistencies in the lighting patterns around the subject\'s face, suggesting a Deepfake synthesis. Specifically, the shadows on the left cheek do not match the background light source.',
        f1: 0.94,
        precision: 0.96,
        recall: 0.92,
        class: 'FAKE'
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const renderIcon = () => {
    switch (type) {
      case 'video': return <FileVideo className="w-12 h-12 text-gray-400" />;
      case 'audio': return <FileAudio className="w-12 h-12 text-gray-400" />;
      case 'image': return <FileImage className="w-12 h-12 text-gray-400" />;
      default: return <Sparkles className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          {renderIcon()}
          {title}
        </h1>
        
        {/* Advanced Toggle */}
        <div className="flex items-center bg-[#2D2D2F] rounded-full p-1 border border-gray-700">
            <button 
                onClick={() => setIsAdvanced(false)}
                className={clsx("px-4 py-1.5 rounded-full text-sm font-medium transition-all", !isAdvanced ? "bg-[var(--primary)] text-black" : "text-gray-400 hover:text-white")}
            >
                Normal
            </button>
            <button 
                onClick={() => setIsAdvanced(true)}
                className={clsx("px-4 py-1.5 rounded-full text-sm font-medium transition-all", isAdvanced ? "bg-[var(--primary)] text-black" : "text-gray-400 hover:text-white")}
            >
                Advanced
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
             <div 
                className="border-2 border-dashed border-gray-600 rounded-lg h-64 flex flex-col items-center justify-center p-6 transition-colors hover:border-[var(--primary)] bg-[var(--card-bg)]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {!file ? (
                    <>
                        <Upload className="w-10 h-10 text-gray-500 mb-4" />
                        <p className="text-gray-300 font-medium">Drag & Drop or Click to Upload</p>
                        <p className="text-gray-500 text-sm mt-2">Supports {type === 'image' ? 'JPG, PNG' : type === 'video' ? 'MP4, MOV' : 'MP3, WAV'}</p>
                        <input 
                            type="file" 
                            className="hidden" 
                            id="file-upload"
                            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                        />
                        <label htmlFor="file-upload" className="mt-4 px-4 py-2 bg-[#2D2D2F] hover:bg-[#3D3D3F] text-white text-sm rounded cursor-pointer border border-gray-600 transition-colors">
                            Select File
                        </label>
                    </>
                ) : (
                    <div className="text-center w-full">
                         <div className="w-16 h-16 bg-[#2D2D2F] rounded-lg mx-auto flex items-center justify-center mb-4">
                            {renderIcon()}
                         </div>
                         <p className="text-white font-medium truncate max-w-full px-4">{file.name}</p>
                         <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                         <button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="mt-6 w-full bg-[var(--primary)] text-black font-semibold py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                         >
                            {isAnalyzing ? 'Analyzing...' : 'Run Detection'}
                         </button>
                         <button onClick={() => {setFile(null); setResult(null);}} className="mt-2 text-xs text-red-400 hover:text-red-300 underline">
                            Remove
                         </button>
                    </div>
                )}
            </div>
            
            {/* LLM Explanation Box (Simplified for Normal / Always visible) */}
            {result && (
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--sidebar-border)]">
                    <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                        <Sparkles className="w-4 h-4" />
                        <h3 className="font-medium text-sm">AI Analysis</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {result.explanation}
                    </p>
                </div>
            )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
            {!result ? (
                <div className="h-full bg-[var(--card-bg)] border border-[var(--sidebar-border)] rounded-lg flex flex-col items-center justify-center text-gray-500 p-12 text-center min-h-[400px]">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p>Upload a file to see analysis results</p>
                </div>
            ) : (
                <>
                    {/* Top Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={clsx("p-4 rounded-lg border flex flex-col items-center justify-center h-24", result.class === 'FAKE' ? "bg-red-500/10 border-red-500/50" : "bg-green-500/10 border-green-500/50")}>
                            <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Result</span>
                            <span className={clsx("text-2xl font-bold", result.class === 'FAKE' ? "text-red-400" : "text-green-400")}>
                                {result.class}
                            </span>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--sidebar-border)] p-4 rounded-lg flex flex-col items-center justify-center h-24">
                             <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Confidence</span>
                             <span className="text-2xl font-bold text-white">{result.accuracy}%</span>
                        </div>
                    </div>

                    {/* Main Visualization (GradCAM) */}
                    <div className="bg-[var(--card-bg)] border border-[var(--sidebar-border)] rounded-lg p-1 overflow-hidden relative min-h-[300px] flex items-center justify-center bg-black">
                        {/* In a real app, this would be the processed image/video */}
                        <Image 
                          src={result.gradCamUrl} 
                          alt="GradCAM Analysis" 
                          width={600}
                          height={400}
                          className="max-h-[400px] w-full object-contain"
                          unoptimized
                        />
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded text-xs text-white border border-gray-700">
                            Grad-CAM Visualization
                        </div>
                    </div>

                    {/* Advanced Stats */}
                    {isAdvanced && (
                         <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-[var(--card-bg)] border border-[var(--sidebar-border)] p-4 rounded-lg">
                                <span className="block text-xs text-gray-500 mb-1">F1 Score</span>
                                <span className="text-xl font-mono text-[var(--primary)]">{result.f1}</span>
                             </div>
                             <div className="bg-[var(--card-bg)] border border-[var(--sidebar-border)] p-4 rounded-lg">
                                <span className="block text-xs text-gray-500 mb-1">Precision</span>
                                <span className="text-xl font-mono text-[var(--success)]">{result.precision}</span>
                             </div>
                             <div className="bg-[var(--card-bg)] border border-[var(--sidebar-border)] p-4 rounded-lg">
                                <span className="block text-xs text-gray-500 mb-1">Recall</span>
                                <span className="text-xl font-mono text-[var(--warning)]">{result.recall}</span>
                             </div>
                         </div>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
}
