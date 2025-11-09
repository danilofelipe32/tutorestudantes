import React, { useState, useEffect, useCallback } from 'react';
import type { Subject, StudyTopic, Flashcard } from '../types';
import { getFlashcardsForTopic, saveFlashcard, deleteFlashcard } from '../services/flashcardService';
import { generateFlashcardsForTopic } from '../services/geminiService';
import { ArrowLeftIcon, PlusIcon, SparklesIcon, TrashIcon, PenNibIcon, BookOpenIcon, ClockIcon } from './Icons';

interface FlashcardsProps {
  subject: Subject;
  topic: StudyTopic;
  onBack: () => void;
}

type View = 'list' | 'study' | 'summary' | 'edit';

const EditFlashcardModal: React.FC<{
    card: Flashcard | { id: null, question: '', answer: '' };
    onSave: (card: Flashcard) => void;
    onCancel: () => void;
}> = ({ card, onSave, onCancel }) => {
    const [question, setQuestion] = useState(card.question);
    const [answer, setAnswer] = useState(card.answer);

    const handleSave = () => {
        if (question.trim() && answer.trim()) {
            onSave({
                ...card,
                id: card.id || Date.now().toString(),
                question,
                answer,
            });
        }
    };

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full shadow-lg animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{card.id ? 'Editar' : 'Novo'} Flashcard</h3>
                <div className="space-y-4">
                    <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Pergunta" rows={3} className="w-full p-2 border rounded-md"/>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Resposta" rows={3} className="w-full p-2 border rounded-md"/>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold">Salvar</button>
                </div>
            </div>
        </div>
    );
};


const Flashcards: React.FC<FlashcardsProps> = ({ subject, topic, onBack }) => {
    const [view, setView] = useState<View>('list');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Study session state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studyResults, setStudyResults] = useState<{ correct: string[], incorrect: string[] }>({ correct: [], incorrect: [] });
    const [shuffledDeck, setShuffledDeck] = useState<Flashcard[]>([]);

    const loadFlashcards = useCallback(() => {
        const stored = getFlashcardsForTopic(subject.id, topic.id);
        setFlashcards(stored);
    }, [subject.id, topic.id]);

    useEffect(() => { loadFlashcards(); }, [loadFlashcards]);

    const handleSave = (card: Flashcard) => {
        saveFlashcard(subject.id, topic.id, card);
        loadFlashcards();
        setView('list');
        setEditingCard(null);
    };
    
    const handleDelete = (cardId: string) => {
        if (window.confirm('Tem certeza que deseja apagar este flashcard?')) {
            deleteFlashcard(subject.id, topic.id, cardId);
            loadFlashcards();
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        const newCards = await generateFlashcardsForTopic(topic);
        let currentCards = getFlashcardsForTopic(subject.id, topic.id);
        newCards.forEach(card => saveFlashcard(subject.id, topic.id, card));
        loadFlashcards();
        setIsGenerating(false);
    };

    const startStudySession = () => {
        // Fisher-Yates shuffle
        const shuffled = [...flashcards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledDeck(shuffled);
        setCurrentIndex(0);
        setStudyResults({ correct: [], incorrect: [] });
        setIsFlipped(false);
        setView('study');
    };

    const handleSelfAssessment = (knewIt: boolean) => {
        const cardId = shuffledDeck[currentIndex].id;
        setStudyResults(prev => ({
            correct: knewIt ? [...prev.correct, cardId] : prev.correct,
            incorrect: !knewIt ? [...prev.incorrect, cardId] : prev.incorrect,
        }));

        if (currentIndex < shuffledDeck.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(i => i + 1);
        } else {
            setView('summary');
        }
    };

    // Render logic
    const renderContent = () => {
        switch(view) {
            case 'study':
                const card = shuffledDeck[currentIndex];
                return (
                    <div className="w-full flex-grow flex flex-col justify-center items-center">
                        <div className="perspective-1000 w-full max-w-sm">
                            <div className="relative w-full h-64 rounded-2xl shadow-lg transition-transform duration-700 transform-style-preserve-3d" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }} onClick={() => setIsFlipped(f => !f)}>
                                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-white border-2 border-gray-200 rounded-2xl">
                                    <p className="text-xl font-semibold text-gray-800">{card.question}</p>
                                </div>
                                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-blue-500 text-white rounded-2xl" style={{ transform: 'rotateY(180deg)' }}>
                                    <p className="text-lg">{card.answer}</p>
                                </div>
                            </div>
                        </div>
                        {isFlipped && (
                            <div className="mt-6 flex space-x-4 animate-fade-in-up">
                                <button onClick={() => handleSelfAssessment(false)} className="px-6 py-3 rounded-xl font-bold bg-red-100 text-red-700 hover:bg-red-200">Revisar</button>
                                <button onClick={() => handleSelfAssessment(true)} className="px-6 py-3 rounded-xl font-bold bg-green-100 text-green-700 hover:bg-green-200">Acertei!</button>
                            </div>
                        )}
                        <p className="mt-4 font-semibold text-gray-500">{currentIndex + 1} / {shuffledDeck.length}</p>
                    </div>
                );

            case 'summary':
                return (
                    <div className="w-full flex-grow flex flex-col justify-center items-center text-center p-4">
                        <div className="animate-pulse mb-4 text-6xl">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800">Sessão Concluída!</h2>
                        <div className="my-6 flex justify-around w-full max-w-xs">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-green-500">{studyResults.correct.length}</p>
                                <p className="text-gray-600">Acertos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-bold text-red-500">{studyResults.incorrect.length}</p>
                                <p className="text-gray-600">Revisar</p>
                            </div>
                        </div>
                        <div className="w-full max-w-sm space-y-3 mt-4">
                            <button onClick={startStudySession} className="w-full py-3 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600">Estudar Novamente</button>
                            <button onClick={() => setView('list')} className="w-full py-3 rounded-xl font-bold bg-gray-200 text-gray-800 hover:bg-gray-300">Voltar à Lista</button>
                        </div>
                    </div>
                );
            
            case 'list':
            default:
                return (
                    <>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <button onClick={() => setView('edit')} className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"><PlusIcon className="h-5 w-5 mr-2"/>Novo Card</button>
                            <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center justify-center p-4 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 disabled:opacity-50"><SparklesIcon className="h-5 w-5 mr-2"/>Gerar (IA)</button>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto">
                            {flashcards.length === 0 ? (
                                <div className="text-center text-gray-500 pt-8">
                                  <p>Nenhum flashcard ainda.</p>
                                  <p>Adicione um novo ou gere com IA!</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {flashcards.map(card => (
                                        <li key={card.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                                            <p className="flex-grow truncate mr-2">{card.question}</p>
                                            <div className="flex-shrink-0 flex items-center space-x-1">
                                                <button onClick={() => { setEditingCard(card); setView('edit'); }} className="p-2 text-gray-400 hover:text-blue-500"><PenNibIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleDelete(card.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <div className="flex items-center overflow-hidden">
                    <button onClick={view === 'list' ? onBack : () => setView('list')} className="mr-2 p-2 rounded-full hover:bg-gray-100 flex-shrink-0">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="font-semibold text-lg text-gray-800 truncate">Flashcards: {subject.name}</h1>
                        <p className="text-sm text-gray-500 truncate">{topic.title}</p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col flex-grow">
                {renderContent()}
            </div>
            
            {view === 'list' && flashcards.length > 0 && (
                <footer className="p-4 bg-white border-t border-gray-200">
                    <button onClick={startStudySession} className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 mr-2"/> Iniciar Sessão de Estudo ({flashcards.length} cards)
                    </button>
                </footer>
            )}

            {view === 'edit' && (
                <EditFlashcardModal
                    card={editingCard || { id: null, question: '', answer: '' }}
                    onSave={handleSave}
                    onCancel={() => { setView('list'); setEditingCard(null); }}
                />
            )}
        </div>
    );
};

export default Flashcards;