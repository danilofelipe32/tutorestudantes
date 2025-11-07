import React, { useState, useEffect, useCallback } from 'react';
import type { Subject, ExerciseQuestion } from '../types';
import { generateExercise } from '../services/geminiService';
import { ArrowLeftIcon, QuestionMarkIcon } from './Icons';

interface ExerciseProps {
  subject: Subject;
  onBack: () => void;
}

const difficultyLevels = ['Fácil', 'Médio', 'Difícil'] as const;
type Difficulty = typeof difficultyLevels[number];

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
  const [difficulty, setDifficulty] = useState<Difficulty>('Médio');

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setIsVerified(false);
    setSelectedOptionId(null);
    setQuestion(null);
    setError(null);
    const newQuestion = await generateExercise(subject, difficulty);
    if (newQuestion) {
      setQuestion(newQuestion);
    } else {
      setError("Não foi possível gerar um exercício. Tente novamente.");
    }
    setLoading(false);
  }, [subject, difficulty]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleVerify = () => {
    if (selectedOptionId) {
      setIsVerified(true);
    }
  };

  const getOptionClasses = (optionId: string) => {
    if (!isVerified) {
      return selectedOptionId === optionId
        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500'
        : 'bg-white border-gray-300 hover:bg-gray-50';
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
    <div className="flex flex-col h-screen bg-white">
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
        <div className="flex justify-center space-x-2 mb-6">
            {difficultyLevels.map((level) => (
                <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        difficulty === level
                        ? 'bg-blue-500 text-white shadow'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {level}
                </button>
            ))}
        </div>

        {loading && <LoadingSpinner />}
        {error && <div className="text-center text-red-500">{error}</div>}
        {question && !loading && (
          <div>
            <div className="flex items-start mb-4">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <QuestionMarkIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">QUESTÃO - {difficulty.toUpperCase()}</p>
                <h2 className="text-lg font-semibold text-gray-800 mt-1">{question.question}</h2>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              {question.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => !isVerified && setSelectedOptionId(option.id)}
                  disabled={isVerified}
                  className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-300 ${getOptionClasses(option.id)}`}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold ${selectedOptionId === option.id || (isVerified && option.id === question.correctOptionId) ? 'border-current' : 'border-gray-300'} text-gray-600`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option.text}</span>
                </button>
              ))}
            </div>

            {isVerified && (
              <div className={`mt-6 p-4 rounded-lg ${selectedOptionId === question.correctOptionId ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <h3 className={`font-bold ${selectedOptionId === question.correctOptionId ? 'text-green-800' : 'text-red-800'}`}>
                  {selectedOptionId === question.correctOptionId ? 'Resposta Correta!' : 'Resposta Incorreta.'}
                </h3>
                <p className="mt-2 text-sm text-gray-700">{question.explanation}</p>
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
              onClick={handleVerify}
              disabled={!selectedOptionId || loading}
              className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed"
            >
              Verificar Resposta
            </button>
        )}
      </footer>
    </div>
  );
};

export default Exercise;