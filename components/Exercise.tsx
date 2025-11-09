

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Subject, ExerciseQuestion, Difficulty } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../services/audioUtils';
import { generateExercise } from '../services/geminiService';
import { getLearningDataForSubject, updateLearningDataForSubject } from '../services/learningService';
import { saveExerciseAttempt } from '../services/exerciseHistoryService';
import { ArrowLeftIcon, QuestionMarkIcon, SpeakerWaveIcon } from './Icons';

interface ExerciseProps {
  subject: Subject;
  onBack: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
    </div>
);

const Exercise: React.FC<ExerciseProps> = ({ subject, onBack }) => {
  const [question, setQuestion] = useState<ExerciseQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // State para TTS
  const [fetchingAudioId, setFetchingAudioId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setPlayingAudioId(null);
  }, []);

  const playClickSound = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      context.resume();
    }
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, context.currentTime);
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }, []);

  // Efeito de limpeza para áudio e AudioContext.
  // Este hook garante que, quando o componente for desmontado, todos os recursos de áudio
  // sejam devidamente liberados para evitar vazamentos de memória.
  useEffect(() => {
    // A função retornada por useEffect é a função de limpeza.
    return () => {
      stopAudio(); // Primeiro, para qualquer áudio que esteja tocando.
  
      const contextToClose = audioContextRef.current;
      // Verifica se o AudioContext existe e se não já foi fechado.
      if (contextToClose && contextToClose.state !== 'closed') {
        // Fecha o AudioContext para liberar os recursos de hardware de áudio do sistema.
        contextToClose.close().catch(e => console.error("Erro ao fechar o AudioContext:", e));
      }
      // Limpa a referência para garantir que não seja reutilizada acidentalmente.
      audioContextRef.current = null;
    };
  }, [stopAudio]);
  
  const handleSpeak = async (text: string, id: string) => {
    playClickSound();

    // 1. Evita múltiplas requisições de áudio simultaneamente.
    if (fetchingAudioId) {
        return;
    }

    // 2. Se o áudio que está tocando for clicado novamente, a ação é parar a reprodução.
    if (playingAudioId === id) {
      stopAudio();
      return; // Interrompe a execução para não reiniciar o áudio imediatamente.
    }
  
    // 3. Se outro áudio estiver tocando, para o áudio antigo antes de prosseguir.
    if (playingAudioId) {
      stopAudio();
    }
  
    try {
      setFetchingAudioId(id);
  
      const ai = new GoogleGenAI({ apiKey: "AIzaSyA8z9gxOEp2usOFToxGQV0z7rWtiya2L9o" });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Voz clara e neutra
            },
          },
        },
      });
  
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Nenhum dado de áudio recebido.");
  
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
  
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContextRef.current,
        24000,
        1,
      );
  
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        if (audioSourceRef.current === source) {
            setPlayingAudioId(null);
            audioSourceRef.current = null;
        }
      };
  
      source.start();
      audioSourceRef.current = source;
      setPlayingAudioId(id); // O áudio agora está tocando.
    } catch (e) {
      console.error("Erro ao reproduzir áudio:", e);
      setError("Não foi possível reproduzir o áudio.");
      setPlayingAudioId(null);
    } finally {
      setFetchingAudioId(null); // A busca terminou (com sucesso ou falha).
    }
  };


  const fetchQuestion = useCallback(async () => {
    stopAudio(); // Para o áudio ao buscar nova questão
    setLoading(true);
    setIsVerified(false);
    setSelectedOptionId(null);
    setQuestion(null);
    setError(null);
    setShowExplanation(false);

    const learningData = getLearningDataForSubject(subject.id);
    const needsReview = learningData.nextReviewDate > 0 && Date.now() >= learningData.nextReviewDate;
    
    setIsReviewMode(needsReview);
    setDifficulty(learningData.currentDifficulty);

    const newQuestion = await generateExercise(subject, learningData.currentDifficulty, needsReview);
    if (newQuestion) {
      setQuestion(newQuestion);
    } else {
      setError("Não foi possível gerar um exercício. Tente novamente.");
    }
    setLoading(false);
  }, [subject, stopAudio]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleSelectAndVerify = (optionId: string) => {
    if (isVerified || !question) return;

    stopAudio(); // Para o áudio ao selecionar uma resposta
    setSelectedOptionId(optionId);
    const isCorrect = optionId === question.correctOptionId;
    
    updateLearningDataForSubject(subject.id, isCorrect);
    saveExerciseAttempt(subject.id, question, optionId, isCorrect);

    setIsVerified(true);
  };

  const getOptionClasses = (optionId: string) => {
    if (!isVerified) {
      return 'bg-white border-gray-300 hover:bg-gray-50';
    }
    if (optionId === question?.correctOptionId) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    if (optionId === selectedOptionId) {
      return 'bg-red-100 border-red-500 text-red-800';
    }
    return 'bg-gray-100 border-gray-300 opacity-70';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center p-4 border-b border-gray-200">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
            <div className={'p-2 rounded-full ' + subject.color + '/20'}>
                <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-','text-')}`} />
            </div>
            <h1 className="font-semibold text-lg ml-3 text-gray-800">{subject.name}</h1>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        {loading && <LoadingSpinner />}
        {error && <div className="text-center text-red-500">{error}</div>}
        {question && !loading && (
          <div>
            <div className="flex items-start mb-4">
              <div className="p-2 bg-gray-100 rounded-lg mr-3 flex-shrink-0">
                <QuestionMarkIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-gray-500">
                  {isReviewMode ? 'REVISÃO' : 'QUESTÃO'} - {difficulty.toUpperCase()}
                </p>
                <h2 className="text-lg font-semibold text-gray-800 mt-1">{question.question}</h2>
              </div>
              <button
                onClick={() => handleSpeak(question.question, 'question')}
                disabled={fetchingAudioId !== null}
                className="ml-4 p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 disabled:opacity-50"
                aria-label="Ouvir a pergunta"
              >
                {fetchingAudioId === 'question' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                ) : (
                    <SpeakerWaveIcon className={`h-6 w-6 transition-transform ${playingAudioId === 'question' ? 'text-blue-500 animate-pulse-speaker' : 'text-gray-500'}`} />
                )}
              </button>
            </div>
            
            <div className="space-y-3 mt-6">
              {question.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAndVerify(option.id)}
                  disabled={isVerified}
                  className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-300 ${getOptionClasses(option.id)}`}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold ${selectedOptionId === option.id || (isVerified && option.id === question.correctOptionId) ? 'border-current' : 'border-gray-300'} text-gray-600`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-grow mr-2">{option.text}</span>
                  <div onClick={(e) => e.stopPropagation()} className="relative">
                      <button
                        onClick={() => handleSpeak(option.text, option.id)}
                        disabled={fetchingAudioId !== null}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-50"
                        aria-label={`Ouvir a opção ${String.fromCharCode(65 + index)}`}
                      >
                        {fetchingAudioId === option.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        ) : (
                          <SpeakerWaveIcon className={`h-5 w-5 transition-transform ${playingAudioId === option.id ? 'text-blue-500 animate-pulse-speaker' : 'text-gray-500'}`} />
                        )}
                      </button>
                    </div>
                </button>
              ))}
            </div>

            {isVerified && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg ${selectedOptionId === question.correctOptionId ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <h3 className={`font-bold ${selectedOptionId === question.correctOptionId ? 'text-green-800' : 'text-red-800'}`}>
                    {selectedOptionId === question.correctOptionId ? 'Resposta Correta!' : 'Resposta Incorreta.'}
                  </h3>
                  {showExplanation && (
                    <p className="mt-2 text-sm text-gray-700">{question.explanation}</p>
                  )}
                </div>

                {!showExplanation && (
                  <button
                    onClick={() => setShowExplanation(true)}
                    className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Explicar Resposta
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="p-4 bg-white border-t border-gray-200">
        {isVerified ? (
            <button
              onClick={fetchQuestion}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Próxima Questão
            </button>
        ) : (
            <button
              disabled={true}
              className="w-full bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl cursor-not-allowed"
            >
              Selecione uma resposta
            </button>
        )}
      </footer>
    </div>
  );
};

export default Exercise;