

import React, { useState, useEffect } from 'react';
import type { Subject } from '../types';
import { getExerciseHistoryForSubject, ExerciseHistoryItem } from '../services/exerciseHistoryService';
// FIX: Removed CheckCircleIcon and XCircleIcon from import as they are not exported from Icons.tsx. The component uses local solid icon versions.
import { ArrowLeftIcon, ChevronRightIcon } from './Icons'; // Supondo que você tenha esses ícones

const CheckCircleIconSolid: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const XCircleIconSolid: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);


interface ExerciseHistoryProps {
  subject: Subject;
  onBack: () => void;
}

const ExerciseHistory: React.FC<ExerciseHistoryProps> = ({ subject, onBack }) => {
  const [history, setHistory] = useState<ExerciseHistoryItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseHistoryItem | null>(null);

  useEffect(() => {
    setHistory(getExerciseHistoryForSubject(subject.id));
  }, [subject.id]);

  if (selectedExercise) {
    const { question, selectedOptionId, isCorrect } = selectedExercise;

    const getOptionClasses = (optionId: string) => {
        const isCorrectAnswer = optionId === question.correctOptionId;
        const isSelectedAnswer = optionId === selectedOptionId;

        if (isCorrectAnswer) return 'bg-green-100 border-green-500 text-green-800';
        if (isSelectedAnswer) return 'bg-red-100 border-red-500 text-red-800';
        return 'bg-gray-100 border-gray-300 opacity-70';
    };

    return (
      <div className="flex flex-col h-full bg-white">
        <header className="flex items-center p-4 border-b border-gray-200">
          <button onClick={() => setSelectedExercise(null)} className="mr-2 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="font-semibold text-lg ml-3 text-gray-800">Revisão de Exercício</h1>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{question.question}</h2>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center p-4 rounded-xl border-2 text-left ${getOptionClasses(option.id)}`}
              >
                <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold border-current text-gray-600`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-bold text-blue-800">Explicação</h3>
              <p className="mt-2 text-sm text-blue-700">{question.explanation}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
            <div className={'p-2 rounded-full ' + subject.color + '/20'}>
                <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
            </div>
            <h1 className="font-semibold text-lg text-gray-800 ml-3">Histórico de Exercícios</h1>
        </div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>Nenhum exercício respondido ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedExercise(item)}
                className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors text-left"
              >
                <div className="flex items-center flex-grow min-w-0">
                  {item.isCorrect ? (
                    <CheckCircleIconSolid className="h-6 w-6 text-green-500 flex-shrink-0 mr-4" />
                  ) : (
                    <XCircleIconSolid className="h-6 w-6 text-red-500 flex-shrink-0 mr-4" />
                  )}
                  <p className="font-medium text-gray-800 truncate">{item.question.question}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExerciseHistory;