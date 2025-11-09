import React from 'react';
import type { Subject } from '../types';
import { Screen } from '../types';
import { 
  ArrowLeftIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon, 
  CpuChipIcon, 
  DocumentTextIcon, 
  RectangleStackIcon, 
  SparklesIcon, 
  Squares2X2Icon 
} from './Icons';

interface SubjectDetailProps {
  subject: Subject;
  onBack: () => void;
  onNavigateTo: (screen: Screen) => void;
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, onBack, onNavigateTo }) => {

    const features = [
        { name: 'Iniciar Exercícios', icon: BookOpenIcon, screen: Screen.EXERCISE, bgColor: 'bg-red-50', iconColor: 'text-red-500', textColor: 'text-red-900' },
        { name: 'Tutor IA (Chat)', icon: ChatBubbleLeftRightIcon, screen: Screen.TUTOR_CHAT, bgColor: 'bg-blue-50', iconColor: 'text-blue-500', textColor: 'text-blue-900' },
        { name: 'Tutor IA (Voz)', icon: SparklesIcon, screen: Screen.LIVE_TUTOR, bgColor: 'bg-purple-50', iconColor: 'text-purple-500', textColor: 'text-purple-900' },
        { name: 'Sessão de Estudo', icon: ClockIcon, screen: Screen.STUDY_SESSION, bgColor: 'bg-amber-50', iconColor: 'text-amber-500', textColor: 'text-amber-900' },
        { name: 'Tópicos de Estudo', icon: Squares2X2Icon, screen: Screen.STUDY_TOPICS, bgColor: 'bg-teal-50', iconColor: 'text-teal-500', textColor: 'text-teal-900' },
        { name: 'Flashcards', icon: RectangleStackIcon, screen: Screen.FLASHCARDS, bgColor: 'bg-green-50', iconColor: 'text-green-500', textColor: 'text-green-900' },
        { name: 'Histórico de Exercícios', icon: DocumentTextIcon, screen: Screen.EXERCISE_HISTORY, bgColor: 'bg-sky-50', iconColor: 'text-sky-500', textColor: 'text-sky-900' },
        { name: 'Histórico de Conversas', icon: ChatBubbleLeftRightIcon, screen: Screen.CHAT_HISTORY, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500', textColor: 'text-indigo-900' },
        { name: 'Recursos Cognitivos', icon: CpuChipIcon, screen: Screen.COGNITIVE_FEATURES, bgColor: 'bg-rose-50', iconColor: 'text-rose-500', textColor: 'text-rose-900' },
    ];
    
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className={`p-6 text-white bg-gradient-to-br ${subject.color.replace('bg-', 'from-') + ' to-' + subject.color.split('-')[1] + '-500'} rounded-b-3xl flex-shrink-0`}>
        <div className="flex items-center mb-6 pt-4">
          <button onClick={onBack} className="mr-4 p-2 -ml-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center">
            <div className="bg-white/30 p-4 rounded-full">
                <subject.icon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
                <h1 className="text-3xl font-bold">{subject.name}</h1>
                <p className="text-white/90 mt-1">{subject.description}</p>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
                <button 
                    key={feature.name}
                    onClick={() => onNavigateTo(feature.screen)}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 aspect-square animate-fade-in-up ${feature.bgColor}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                  <feature.icon className={`h-8 w-8 mb-3 ${feature.iconColor}`} />
                  <span className={`font-semibold text-sm ${feature.textColor}`}>{feature.name}</span>
                </button>
            ))}
        </div>
      </main>
    </div>
  );
};

export default SubjectDetail;