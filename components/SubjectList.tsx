import React, { useState, useEffect } from 'react';
import type { Subject } from '../types';
import { BookIcon, CalculatorIcon, FlaskIcon, ClockIcon, GlobeIcon, TranslateIcon, ChevronRightIcon, BellIcon } from './Icons';
import { getAllLearningData, SubjectLearningData } from '../services/learningService';

interface SubjectListProps {
  onSelectSubject: (subject: Subject) => void;
}

const subjects: Subject[] = [
  { id: 'portugues', name: 'Português', description: 'Gramática, leitura e interpretação de textos', color: 'bg-brand-red', icon: BookIcon },
  { id: 'literatura', name: 'Literatura', description: 'Análise de obras e movimentos literários', color: 'bg-brand-red', icon: BookIcon },
  { id: 'matematica', name: 'Matemática', description: 'Álgebra, geometria, estatística e funções', color: 'bg-brand-green', icon: CalculatorIcon },
  { id: 'fisica', name: 'Física', description: 'Mecânica, termologia, óptica e eletricidade', color: 'bg-brand-green', icon: CalculatorIcon },
  { id: 'quimica', name: 'Química', description: 'Estudo da matéria e suas transformações', color: 'bg-brand-teal', icon: FlaskIcon },
  { id: 'biologia', name: 'Biologia', description: 'Estudo dos seres vivos e ecossistemas', color: 'bg-brand-teal', icon: FlaskIcon },
  { id: 'historia', name: 'História', description: 'História do Brasil e mundial, da antiguidade à atualidade', color: 'bg-brand-orange', icon: ClockIcon },
  { id: 'geografia', name: 'Geografia', description: 'Geografia física, humana, política e econômica', color: 'bg-brand-lime', icon: GlobeIcon },
  { id: 'filosofia', name: 'Filosofia', description: 'Grandes pensadores e questões existenciais', color: 'bg-brand-purple', icon: BookIcon },
  { id: 'sociologia', name: 'Sociologia', description: 'Estruturas sociais e relações humanas', color: 'bg-brand-purple', icon: BookIcon },
  { id: 'ingles', name: 'Inglês', description: 'Vocabulário, gramática e conversação', color: 'bg-brand-red', icon: TranslateIcon },
  { id: 'espanhol', name: 'Espanhol', description: 'Vocabulário, gramática e conversação', color: 'bg-brand-green', icon: TranslateIcon },
  { id: 'artes', name: 'Artes', description: 'História da arte, música e expressões', color: 'bg-brand-teal', icon: BookIcon },
  { id: 'educacaofisica', name: 'Educação Física', description: 'Corpo, movimento, saúde e esportes', color: 'bg-brand-orange', icon: GlobeIcon },
];

const SubjectCard: React.FC<{
    subject: Subject;
    onClick: () => void;
    needsReview: boolean;
    stats: { totalExercises: number; correctAnswers: number };
}> = ({ subject, onClick, needsReview, stats }) => {
    const accuracy = stats.totalExercises > 0
        ? Math.round((stats.correctAnswers / stats.totalExercises) * 100)
        : 0;

    return (
        <button
            onClick={onClick}
            className={`w-full p-5 rounded-2xl text-white shadow-md transition-transform hover:scale-105 ${subject.color} relative overflow-hidden`}
        >
            {needsReview && (
                <div className="absolute top-2 right-2 flex items-center bg-white/25 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <BellIcon className="h-4 w-4 mr-1"/>
                    Revisar
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-white/30 p-3 rounded-full">
                        <subject.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="font-bold text-lg">{subject.name}</h3>
                        <p className="text-sm opacity-90">{subject.description}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-white/70" />
            </div>
            
            {stats.totalExercises > 0 && (
                <>
                    <div className="border-t border-white/30 my-3"></div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>
                            {stats.totalExercises} {stats.totalExercises === 1 ? 'exercício' : 'exercícios'}
                        </span>
                        <span>{accuracy}% de acerto</span>
                    </div>
                </>
            )}
        </button>
    );
};


const SubjectList: React.FC<SubjectListProps> = ({ onSelectSubject }) => {
  const [learningData, setLearningData] = useState<Record<string, SubjectLearningData>>({});

  useEffect(() => {
    setLearningData(getAllLearningData());
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="pt-8 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Olá, Estudante! <span role="img" aria-label="waving hand">👋</span>
        </h1>
        <p className="text-gray-500 mt-2">Escolha uma matéria para começar a estudar</p>
      </header>
      <main className="flex-grow space-y-4 overflow-y-auto pb-4">
        {subjects.map((subject) => {
            const data = learningData[subject.id];
            const needsReview = data ? (data.nextReviewDate > 0 && Date.now() >= data.nextReviewDate) : false;
            const stats = {
                totalExercises: data?.totalExercises || 0,
                correctAnswers: data?.correctAnswers || 0,
            };
            return (
              <SubjectCard 
                key={subject.id} 
                subject={subject} 
                onClick={() => onSelectSubject(subject)}
                needsReview={needsReview}
                stats={stats}
              />
            );
        })}
      </main>
    </div>
  );
};

export default SubjectList;