
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from '../types';
import { connectLive, LiveSession } from '../services/geminiService';
import { MicIcon } from './icons';
import { Loader } from './Loader';
import { createBlob, decode, decodeAudioData } from '../utils/fileUtils';
import { LiveServerMessage } from '@google/genai';

const TranscriptDisplay: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === Role.USER;
  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xl p-3 rounded-lg ${isUser ? 'bg-brand-accent text-white' : 'bg-brand-secondary'}`}>
         <p className="font-semibold text-sm mb-1">{isUser ? 'You' : 'Growify AI'}</p>
         <p>{message.text}</p>
      </div>
    </div>
  );
};


export const ChatPanel: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const stopSession = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.error("Error closing session:", e);
        }
    }
    
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    sessionPromiseRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    scriptProcessorRef.current = null;
    microphoneStreamRef.current = null;
    nextStartTimeRef.current = 0;
    
    setIsSessionActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Your browser does not support the necessary audio APIs.");
        setIsConnecting(false);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStreamRef.current = stream;

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        const callbacks = {
            onopen: () => {
                console.log("Live session opened.");
                setIsConnecting(false);
                setIsSessionActive(true);

                const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                // Live update for user's speech
                if (message.serverContent?.inputTranscription) {
                    currentInputTranscription += message.serverContent.inputTranscription.text;
                    setTranscript(prev => {
                        const newTranscript = [...prev];
                        const lastMessage = newTranscript[newTranscript.length - 1];
                        if (lastMessage && lastMessage.role === Role.USER) {
                            newTranscript[newTranscript.length - 1] = { ...lastMessage, text: currentInputTranscription };
                        } else {
                            newTranscript.push({ role: Role.USER, text: currentInputTranscription });
                        }
                        return newTranscript;
                    });
                }

                // Live update for model's speech
                if (message.serverContent?.outputTranscription) {
                    currentOutputTranscription += message.serverContent.outputTranscription.text;
                    setTranscript(prev => {
                        const newTranscript = [...prev];
                        const lastMessage = newTranscript[newTranscript.length - 1];
                        if (lastMessage && lastMessage.role === Role.MODEL) {
                            newTranscript[newTranscript.length - 1] = { ...lastMessage, text: currentOutputTranscription };
                        } else {
                            newTranscript.push({ role: Role.MODEL, text: currentOutputTranscription });
                        }
                        return newTranscript;
                    });
                }
                
                // When a user-model turn is complete, reset for the next turn.
                if (message.serverContent?.turnComplete) {
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }

                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audioData) {
                    const outputCtx = outputAudioContextRef.current!;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputCtx.destination);
                    
                    source.onended = () => sourcesRef.current.delete(source);
                    sourcesRef.current.add(source);
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                }
            },
            onclose: () => {
                console.log("Live session closed.");
                stopSession();
            },
            onerror: (e: ErrorEvent) => {
                console.error("Live session error:", e);
                setError(`A connection error occurred: ${e.message}`);
                stopSession();
            },
        };

        sessionPromiseRef.current = connectLive(callbacks);
        await sessionPromiseRef.current; 

    } catch (e) {
        console.error("Failed to start session:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while starting the session.");
        setIsConnecting(false);
        await stopSession();
    }
  }, [stopSession]);

  useEffect(() => {
    return () => {
        if(isSessionActive) {
            stopSession();
        }
    };
  }, [isSessionActive, stopSession]);

  const handleToggleSession = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-secondary">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.length === 0 && !isSessionActive && !isConnecting && (
             <div className="text-center text-brand-text/80 mt-8">
                <h2 className="text-2xl font-bold text-white mb-2">Growify Live</h2>
                <p>Press the microphone button to start a real-time voice conversation.</p>
             </div>
        )}
        {transcript.map((msg, index) => (
          <TranscriptDisplay key={index} message={msg} />
        ))}
        {isConnecting && <Loader />}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className="p-4 text-red-400 bg-red-900/50 flex-shrink-0">{error}</div>}
      <div className="p-4 border-t border-brand-primary/50 flex flex-col items-center justify-center flex-shrink-0">
         <button
            onClick={handleToggleSession}
            disabled={isConnecting}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-accent hover:bg-sky-400'}
                ${isConnecting ? 'bg-gray-500 cursor-not-allowed' : ''}
                text-white focus:outline-none focus:ring-4 focus:ring-sky-300/50
            `}
            aria-label={isSessionActive ? 'Stop conversation' : 'Start conversation'}
         >
            {isConnecting ? <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div> : <MicIcon className="w-10 h-10" />}
         </button>
         <p className="text-sm text-brand-text/70 mt-3">
            {isConnecting ? "Connecting..." : isSessionActive ? "Conversation is live..." : "Tap to speak"}
         </p>
      </div>
    </div>
  );
};
