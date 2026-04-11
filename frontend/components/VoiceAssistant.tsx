
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, X, Volume2, Sparkles, Loader2 } from 'lucide-react';

interface VoiceAssistantProps {
  onClose: () => void;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [transcript, setTranscript] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputCtx;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              setIsActive(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                const pcmBlob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                setTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
              }
              if (message.serverContent?.turnComplete) {
                setTranscript('');
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => setIsActive(false),
            onerror: (e) => console.error("Live API Error:", e),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            outputAudioTranscription: {},
            systemInstruction: 'You are a Startup Legal & Finance Assistant. You speak clearly and help founders understand Indian regulations in a conversational way.',
          },
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to connect to Live API", err);
        setIsConnecting(false);
      }
    };

    startSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-6">
      <div className="max-w-md w-full glass rounded-[3rem] border border-white/20 p-8 flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={20} />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Realtime Consultation</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative flex items-center justify-center py-12">
          {isConnecting ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <p className="text-emerald-400 text-sm font-medium animate-pulse">Establishing Secure Link...</p>
            </div>
          ) : (
            <div className="relative">
              <div className={`absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl transition-transform duration-500 ${isActive ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isActive ? 'border-emerald-500 bg-emerald-500/10 scale-110 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-white/10'}`}>
                <Volume2 className={`${isActive ? 'text-emerald-400 animate-pulse' : 'text-gray-600'}`} size={48} />
              </div>
            </div>
          )}
        </div>

        <div className="w-full text-center space-y-4">
          <h3 className="text-2xl font-bold text-white">
            {isConnecting ? 'Initializing Assistant' : isActive ? 'Listening for your query...' : 'Consultation Ended'}
          </h3>
          <p className="text-sm text-gray-500 px-4">
            Speak naturally about GST, company law, or funding. The assistant will respond instantly in voice.
          </p>
        </div>

        <div className="w-full glass bg-black/40 rounded-2xl p-4 min-h-[100px] border border-white/5 flex flex-col items-center justify-center italic text-sm text-gray-400">
          {transcript || (isActive && !isConnecting ? "Assistant is ready to help..." : "Waiting for connection...")}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            End-to-End Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;