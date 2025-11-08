

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import type { Subject } from '../types';
import { ArrowLeftIcon, MicrophoneIcon, MicrophoneSlashIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './Icons';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';

// Chave de API para fase de testes
const ai = new GoogleGenAI({ apiKey: "AIzaSyA8z9gxOEp2usOFToxGQV0z7rWtiya2L9o" });

interface LiveTutorProps {
  subject: Subject;
  onBack: () => void;
}

type SessionStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

const LiveTutor: React.FC<LiveTutorProps> = ({ subject, onBack }) => {
  const [status, setStatus] = useState<SessionStatus>('IDLE');
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 1

  // Usa 'any' para o tipo de sessão, já que 'LiveSession' não é exportado.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      source.stop();
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsBotSpeaking(false);
  }, []);

  const cleanup = useCallback(() => {
    console.log("Cleaning up resources...");
    stopAllAudio();

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.close();
        console.log("Session closed.");
      }).catch(e => console.error("Error closing session:", e));
      sessionPromiseRef.current = null;
    }

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (outputGainNodeRef.current) {
        outputGainNodeRef.current.disconnect();
        outputGainNodeRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close().catch(e => console.error("Error closing input context:", e));
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(e => console.error("Error closing output context:", e));
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setStatus('IDLE');
  }, [stopAllAudio]);

  const startSession = useCallback(async () => {
    if (status !== 'IDLE' && status !== 'ERROR') return;
    
    setError(null);
    setStatus('CONNECTING');
    
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Permissão para usar o microfone foi negada. Por favor, habilite nas configurações do seu navegador.");
      setStatus('ERROR');
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
    outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
    outputGainNodeRef.current = outputAudioContextRef.current.createGain();
    outputGainNodeRef.current.gain.value = volume;
    outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);
    nextStartTimeRef.current = 0;
    
    sessionPromiseRef.current = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `Você é um tutor de ${subject.name} amigável e prestativo para um estudante do ensino médio no Brasil. Fale em português brasileiro. Mantenha suas respostas concisas e guie o aluno a pensar, em vez de dar respostas diretas.`,
      },
      callbacks: {
        onopen: () => {
          setStatus('CONNECTED');
          console.log("Session opened. Starting microphone stream.");
          
          if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
          const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
          scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
            if (isMutedRef.current) return;
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            if(sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
          };

          source.connect(scriptProcessorRef.current);
          scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            setIsBotSpeaking(true);
            const outputContext = outputAudioContextRef.current;
            if (!outputContext || !outputGainNodeRef.current) return;
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);

            const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, 24000, 1);
            const source = outputContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputGainNodeRef.current);

            source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                    setIsBotSpeaking(false);
                }
            });

            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }
          
          if (message.serverContent?.interrupted) {
            console.log("Interrupted by user.");
            stopAllAudio();
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error("Session error:", e);
          setError("Ocorreu um erro na conexão. Por favor, tente novamente.");
          setStatus('ERROR');
          cleanup();
        },
        onclose: (e: CloseEvent) => {
          console.log("Session closed.");
          cleanup();
        },
      },
    });
  }, [subject.name, status, cleanup, stopAllAudio, volume]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleMainButtonClick = () => {
    if (status === 'IDLE' || status === 'ERROR') {
      startSession();
    } else {
      cleanup();
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (outputGainNodeRef.current) {
      outputGainNodeRef.current.gain.value = newVolume;
    }
  };

  const handleToggleVolume = () => {
    const newVolume = volume > 0 ? 0 : 1;
    setVolume(newVolume);
    if (outputGainNodeRef.current) {
        outputGainNodeRef.current.gain.value = newVolume;
    }
  };

  const getStatusText = () => {
    switch(status) {
      case 'IDLE': return 'Toque para começar';
      case 'CONNECTING': return 'Conectando...';
      case 'CONNECTED':
        if (isBotSpeaking) return 'Falando...';
        return 'Ouvindo...';
      case 'ERROR': return 'Erro na conexão';
    }
  };

  const getButtonText = () => {
    if (status === 'IDLE' || status === 'ERROR') return 'Iniciar Sessão de Voz';
    return 'Encerrar Sessão';
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={status === 'CONNECTING'}>
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
            <div className={'p-2 rounded-full ' + subject.color + '/20'}>
                <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
            </div>
            <h1 className="font-semibold text-lg ml-3 text-gray-800">Tutor por Voz: {subject.name}</h1>
        </div>
      </header>

      <main className="flex-grow p-6 flex flex-col justify-center items-center text-center">
        <div 
          className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300
            ${status === 'CONNECTED' ? 'bg-blue-100' : 'bg-gray-200'}
          `}
        >
          <div 
            className={`absolute w-full h-full rounded-full transition-transform
              ${isBotSpeaking ? `bg-blue-200 animate-ping` : ''}
            `}
            style={{ animationDuration: '1.5s' }}
          ></div>
          <MicrophoneIcon className={`h-20 w-20 z-10 transition-colors
            ${status === 'CONNECTED' ? 'text-blue-500' : 'text-gray-500'}
            ${isBotSpeaking ? 'text-blue-600' : ''}
          `} />
        </div>
        <p className="mt-8 text-xl font-semibold text-gray-700">{getStatusText()}</p>
        {error && <p className="mt-2 text-red-500">{error}</p>}
      </main>

      <footer className="p-4 bg-white border-t border-gray-200 space-y-4">
        {status === 'CONNECTED' && (
            <div className="flex items-center justify-between animate-fade-in space-x-4">
                <button
                    onClick={handleToggleMute}
                    className={`p-4 rounded-full transition-colors ${
                        isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                    {isMuted ? <MicrophoneSlashIcon className="h-6 w-6"/> : <MicrophoneIcon className="h-6 w-6"/>}
                </button>
                
                <div className="flex-grow flex items-center">
                    <button onClick={handleToggleVolume} className="p-2 mr-2">
                        {volume > 0 ? <SpeakerWaveIcon className="h-6 w-6 text-gray-600"/> : <SpeakerXMarkIcon className="h-6 w-6 text-gray-600"/>}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
        )}

        <button
            onClick={handleMainButtonClick}
            className={`w-full font-semibold py-3 rounded-xl transition-colors
              ${(status === 'IDLE' || status === 'ERROR') ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-red-500 text-white hover:bg-red-600'}
            `}
        >
          {getButtonText()}
        </button>
      </footer>
    </div>
  );
};

export default LiveTutor;
