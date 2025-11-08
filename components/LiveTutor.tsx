import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import type { Subject } from '../types';
import { ArrowLeftIcon, MicrophoneIcon, MicrophoneSlashIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './Icons';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';

// FIX: The API key must be obtained from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: "AIzaSyA8z9gxOEp2usOFToxGQV0z7rWtiya2L9o" });

interface LiveTutorProps {
  subject: Subject;
  onBack: () => void;
}

type SessionStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface TranscriptionEntry {
  sender: 'user' | 'bot';
  text: string;
}

const LiveTutor: React.FC<LiveTutorProps> = ({ subject, onBack }) => {
  const [status, setStatus] = useState<SessionStatus>('IDLE');
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);

  // State for transcriptions
  const [currentUserTranscription, setCurrentUserTranscription] = useState('');
  const [currentBotTranscription, setCurrentBotTranscription] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);

  // Refs for managing audio and session state
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted);

  // Refs for accumulating transcription text to avoid stale state in callbacks
  const userTranscriptionRef = useRef('');
  const botTranscriptionRef = useRef('');
  const historyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  
  useEffect(() => {
    // Auto-scroll to the bottom of the history
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
    }
  }, [transcriptionHistory, currentUserTranscription, currentBotTranscription]);

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
    setTranscriptionHistory([]);
    setCurrentUserTranscription('');
    setCurrentBotTranscription('');
    userTranscriptionRef.current = '';
    botTranscriptionRef.current = '';
    
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
        inputAudioTranscription: {},
        outputAudioTranscription: {},
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

          if (message.serverContent?.inputTranscription) {
            userTranscriptionRef.current += message.serverContent.inputTranscription.text;
            setCurrentUserTranscription(userTranscriptionRef.current);
          }

          if (message.serverContent?.outputTranscription) {
            botTranscriptionRef.current += message.serverContent.outputTranscription.text;
            setCurrentBotTranscription(botTranscriptionRef.current);
          }

          if (message.serverContent?.turnComplete) {
            const userText = userTranscriptionRef.current.trim();
            const botText = botTranscriptionRef.current.trim();

            // Limpa as transcrições temporárias "em progresso" da UI
            setCurrentUserTranscription('');
            setCurrentBotTranscription('');

            // Adiciona as transcrições completas do usuário e do bot ao histórico permanente
            setTranscriptionHistory(prev => {
                const newHistory = [...prev];
                if (userText) {
                    newHistory.push({ sender: 'user', text: userText });
                }
                if (botText) {
                    // Isso garante que apenas o texto final e completo do bot seja adicionado ao histórico.
                    newHistory.push({ sender: 'bot', text: botText });
                }
                return newHistory;
            });

            // Reseta as refs que acumulam texto para a próxima rodada
            userTranscriptionRef.current = '';
            botTranscriptionRef.current = '';
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
      setShowEndSessionConfirm(true);
    }
  };

  const handleConfirmEndSession = () => {
    cleanup();
    setShowEndSessionConfirm(false);
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

  const getStatusIndicator = () => {
    let color = 'bg-gray-400';
    let text = 'Offline';
    switch (status) {
        case 'CONNECTING':
            color = 'bg-yellow-400 animate-pulse';
            text = 'Conectando';
            break;
        case 'CONNECTED':
            color = 'bg-green-500 animate-pulse-connected';
            text = isBotSpeaking ? 'Falando' : 'Ouvindo';
            break;
        case 'ERROR':
            color = 'bg-red-500';
            text = 'Erro';
            break;
    }
    return (
        <div className="flex items-center">
            <span className={`h-2.5 w-2.5 rounded-full ${color} mr-2`}></span>
            <span className="text-sm text-gray-600">{text}</span>
        </div>
    );
  };

  const getButtonText = () => {
    if (status === 'IDLE' || status === 'ERROR') return 'Iniciar Sessão de Voz';
    return 'Encerrar Sessão';
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
            <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={status === 'CONNECTING'}>
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className={'p-2 rounded-full ' + subject.color + '/20'}>
                <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
            </div>
            <h1 className="font-semibold text-lg ml-3 text-gray-800">Tutor: {subject.name}</h1>
        </div>
        {getStatusIndicator()}
      </header>

      <main ref={historyContainerRef} className="flex-grow p-4 overflow-y-auto">
        {status === 'IDLE' || status === 'ERROR' ? (
             <div className="h-full flex flex-col justify-center items-center text-center">
                <MicrophoneIcon className="h-24 w-24 text-gray-300 mb-4"/>
                <h2 className="text-xl font-bold text-gray-700">Tutor por Voz</h2>
                <p className="text-gray-500 mt-1 max-w-sm">Converse em tempo real com seu tutor. Pressione 'Iniciar' para começar.</p>
                {error && <p className="mt-4 text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
            </div>
        ) : (
          <div className="space-y-4">
            {transcriptionHistory.map((entry, index) => (
              <div key={index} className={`flex ${entry.sender === 'user' ? 'justify-end animate-chat-user' : 'justify-start animate-chat-bot'}`}>
                <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                  entry.sender === 'user' ? `bg-blue-500 text-white rounded-br-lg` : 'bg-gray-200 text-gray-800 rounded-bl-lg'
                }`}>
                  <p className="text-sm">{entry.text}</p>
                </div>
              </div>
            ))}
             {currentUserTranscription && (
                <div className="flex justify-end animate-fade-in">
                    <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-blue-200 text-blue-800 rounded-br-lg italic">
                        <p className="text-sm">{currentUserTranscription}</p>
                    </div>
                </div>
            )}
            {currentBotTranscription && (
                <div className="flex justify-start animate-fade-in">
                     <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-500 rounded-bl-lg italic">
                        <p className="text-sm">{currentBotTranscription}</p>
                    </div>
                </div>
            )}
          </div>
        )}
      </main>

      <footer className="p-4 bg-white border-t border-gray-200 space-y-4">
        {status === 'CONNECTED' && (
            <div className="flex items-center justify-between animate-fade-in space-x-4">
                <button
                    onClick={handleToggleMute}
                    title={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
                    className={`p-4 rounded-full transition-colors ${
                        isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                    {isMuted ? <MicrophoneSlashIcon className="h-6 w-6"/> : <MicrophoneIcon className="h-6 w-6"/>}
                </button>
                
                <div className="flex-grow flex items-center">
                    <button onClick={handleToggleVolume} className="p-2 mr-2" title={volume > 0 ? 'Mudo' : 'Ativar som'}>
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
                        title={`Volume: ${Math.round(volume * 100)}%`}
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

      {showEndSessionConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full shadow-lg text-center animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-800">Encerrar Sessão?</h3>
                <p className="text-gray-600 my-4">Tem certeza de que deseja encerrar a sessão de voz com o tutor?</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => setShowEndSessionConfirm(false)}
                        className="w-full font-semibold py-2 px-4 rounded-xl transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmEndSession}
                        className="w-full font-semibold py-2 px-4 rounded-xl transition-colors bg-red-500 text-white hover:bg-red-600"
                    >
                        Encerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LiveTutor;