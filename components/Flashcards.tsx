import React, { useState, useEffect, useCallback } from 'react';
import type { Subject, StudyTopic, Flashcard } from '../types';
import { getFlashcardsForTopic, saveFlashcardsForTopic } from '../services/flashcardService';
import { generateFlashcardsForTopic } from '../services/geminiService';
import { ArrowLeftIcon, PlusIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, ArrowUturnLeftIcon } from './Icons';

interface FlashcardsProps {
  subject: Subject;
  topic: StudyTopic;
  onBack: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ subject, topic, onBack }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadFlashcards = useCallback(() => {
    setIsLoading(true);
    const storedFlashcards = getFlashcardsForTopic(subject.id, topic.id);
    setFlashcards(storedFlashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsLoading(false);
  }, [subject.id, topic.id]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newFlashcards = await generateFlashcardsForTopic(topic);
    const allFlashcards = [...flashcards, ...newFlashcards];
    saveFlashcardsForTopic(subject.id, topic.id, allFlashcards);
    setFlashcards(allFlashcards);
    setIsGenerating(false);
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-semibold text-lg text-gray-800">Flashcards: {subject.name}</h1>
            <p className="text-sm text-gray-500 truncate">{topic.title}</p>
          </div>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          {isGenerating ? 
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div> : 
            <SparklesIcon className="h-6 w-6 text-blue-500" />
          }
        </button>
      </header>

      <main className="flex-grow p-6 flex flex-col justify-center items-center">
        {isLoading ? (
          <p>Carregando...</p>
        ) : flashcards.length === 0 ? (
          <div className="text-center text-gray-600">
            <p className="mb-4">Nenhum flashcard encontrado para este tópico.</p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Flashcards com IA'}
              <SparklesIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div className="perspective-1000">
              <div
                className={`relative w-full h-64 rounded-2xl shadow-lg transition-transform duration-700 transform-style-preserve-3d cursor-pointer`}
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-white border-2 border-gray-200 rounded-2xl">
                  <p className="text-xl font-semibold text-gray-800">{currentCard.question}</p>
                </div>
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-blue-500 text-white rounded-2xl" style={{ transform: 'rotateY(180deg)' }}>
                  <p className="text-lg">{currentCard.answer}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button onClick={prevCard} disabled={currentIndex === 0} className="p-3 rounded-full bg-white shadow disabled:opacity-30">
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <span className="font-semibold text-gray-700">{currentIndex + 1} / {flashcards.length}</span>
              <button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="p-3 rounded-full bg-white shadow disabled:opacity-30">
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
             <button onClick={() => setIsFlipped(!isFlipped)} className="mt-4 flex items-center text-blue-500 font-semibold">
                <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                Virar Card
             </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Flashcards;
