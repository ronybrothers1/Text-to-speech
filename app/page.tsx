'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Loader2, Sparkles, Settings2, Languages, Moon, Sun, MonitorPlay } from 'lucide-react';
import { VOICES, SPEAKING_STYLES, EMOTIONS } from '@/lib/constants';
import { base64ToUint8Array, mergeUint8Arrays, createWavBlob } from '@/lib/audio';

export default function NeuralVoiceApp() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [style, setStyle] = useState(SPEAKING_STYLES[0].id);
  const [emotion, setEmotion] = useState(EMOTIONS[0].id);
  const [speed, setSpeed] = useState('1.0');
  const [pitch, setPitch] = useState('1.0');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value.slice(0, 10000));
  };

  const splitTextIntoChunks = (text: string, maxLength: number = 800): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  };

  const generateAudio = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setAudioUrl(null);
    if (audioRef.current) {
        audioRef.current.pause();
    }

    try {
      const chunks = splitTextIntoChunks(text);
      const pcmArrays: Uint8Array[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        let playbackPace = '';
        if (parseFloat(speed) > 1.0) playbackPace = 'fast';
        if (parseFloat(speed) < 1.0) playbackPace = 'slow';

        let playbackPitch = '';
        if (parseFloat(pitch) > 1.0) playbackPitch = 'high';
        if (parseFloat(pitch) < 1.0) playbackPitch = 'deep';

        const styleName = SPEAKING_STYLES.find(s => s.id === style)?.label;
        const emotionName = EMOTIONS.find(e => e.id === emotion)?.label;

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk,
            voice,
            style: styleName,
            emotion: emotion !== 'neutral' ? emotionName : null,
            speed: playbackPace,
            pitch: playbackPitch
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate audio for chunk');
        }

        const data = await response.json();
        pcmArrays.push(base64ToUint8Array(data.audio));
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      const mergedPcm = mergeUint8Arrays(pcmArrays);
      const wavBlob = createWavBlob(mergedPcm, 24000);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Terdapat kesalahan saat menghasilkan audio. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.playbackRate = parseFloat(speed);
      audioRef.current.preservesPitch = false; 
      audioRef.current.play().catch(e => console.error("Playback error:", e));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">NeuralVoice <span className="font-light text-blue-600 dark:text-blue-400">Pro</span></span>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Text Input */}
        <section className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm min-h-[400px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-t-2xl flex justify-between items-center">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Languages className="w-4 h-4" /> Text Input
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              <span className={text.length >= 10000 ? "text-red-500" : ""}>{text.length.toLocaleString()}</span> / 10,000
            </span>
          </div>
          <textarea
            className="flex-1 w-full resize-none p-6 bg-transparent outline-none text-slate-700 dark:text-slate-300 leading-relaxed rounded-b-2xl"
            placeholder="Ketik atau tempel teks Anda di sini. NeuralVoice Pro akan memprosesnya hingga 10.000 karakter menjadi ucapan yang sangat realistis dengan emosi dan gaya bicara..."
            value={text}
            onChange={handleTextChange}
            maxLength={10000}
          />
        </section>

        {/* Right Column: Settings & Controls */}
        <section className="w-full lg:w-[420px] flex flex-col gap-6 overflow-y-auto pb-24 lg:pb-0 relative scrollbar-hide">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Settings2 className="w-4 h-4" /> Voice Configuration
            </h3>

            <div className="space-y-4">
              {/* Voice Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Model Voice</label>
                <div className="grid grid-cols-1 gap-2">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all ${
                        voice === v.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500/20' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-medium ${voice === v.id ? 'text-blue-700 dark:text-blue-300' : ''}`}>{v.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                          {v.gender}
                        </span>
                      </div>
                      <span className="text-xs opacity-70 line-clamp-1">{v.character}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Speaking Style</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none font-medium"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  {SPEAKING_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {/* Emotion Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Emotion Signature</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none font-medium"
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                >
                  {EMOTIONS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Volume2 className="w-4 h-4" /> Sonic Adjustments
            </h3>
            
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">
                  <span>Speed</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">{parseFloat(speed).toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="2.0" step="0.1" 
                  value={speed} onChange={(e) => setSpeed(e.target.value)}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">
                  <span>Pitch</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">{parseFloat(pitch).toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="1.5" step="0.1" 
                  value={pitch} onChange={(e) => setPitch(e.target.value)}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={generateAudio}
              disabled={!text.trim() || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-medium py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group relative overflow-hidden active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <div className="absolute inset-0 bg-blue-500 opacity-20 animate-pulse"></div>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Synthesizing... {progress}%</span>
                </>
              ) : (
                <>
                  <MonitorPlay className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Generate Audio</span>
                </>
              )}
            </button>
          </div>
        </section>
      </main>

      {/* Floating Output Panel */}
      {audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-max min-w-[340px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-t-3xl lg:rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-4 z-50 animate-in slide-in-from-bottom-8">
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onPlay={() => setIsPlaying(true)} 
            onPause={() => setIsPitchAdjustingAndPlayingStatus(false)}
            onEnded={() => setIsPitchAdjustingAndPlayingStatus(false)}
            className="hidden"
          />
          
          <button 
            onClick={handlePlayPause}
            className="w-12 h-12 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </button>
          
          <div className="flex-1 sm:px-4 text-center sm:text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Neural Synthesis Complete</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Format: WAV (PCM)</div>
          </div>

          <a 
            href={audioUrl} 
            download={`NeuralVoice_${new Date().getTime()}.wav`}
            className="flex-shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm tracking-wide py-3 px-6 rounded-full flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" /> DOWNLOAD
          </a>
        </div>
      )}

    </div>
  );

  function setIsPitchAdjustingAndPlayingStatus(status: boolean) {
    setIsPlaying(status);
  }
}
