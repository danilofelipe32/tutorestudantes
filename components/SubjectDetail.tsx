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
        { name: 'Iniciar Exercícios', icon: BookOpenIcon, screen: Screen.EXERCISE },
        { name: 'Tutor IA (Chat)', icon: ChatBubbleLeftRightIcon, screen: Screen.TUTOR_CHAT },
        { name: 'Tutor IA (Voz)', icon: SparklesIcon, screen: Screen.LIVE_TUTOR },
        { name: 'Sessão de Estudo', icon: ClockIcon, screen: Screen.STUDY_SESSION },
        { name: 'Tópicos de Estudo', icon: Squares2X2Icon, screen: Screen.STUDY_TOPICS },
        { name: 'Flashcards', icon: RectangleStackIcon, screen: Screen.FLASHCARDS },
        { name: 'Histórico de Exercícios', icon: DocumentTextIcon, screen: Screen.EXERCISE_HISTORY },
        { name: 'Histórico de Conversas', icon: ChatBubbleLeftRightIcon, screen: Screen.CHAT_HISTORY },
        { name: 'Recursos Cognitivos', icon: CpuChipIcon, screen: Screen.COGNITIVE_FEATURES },
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
            {features.map((feature) => (
                <button 
                    key={feature.name}
                    onClick={() => onNavigateTo(feature.screen)}
                    className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-left flex flex-col justify-between aspect-square"
                >
                  <div>
                    <div className={`p-2 rounded-full w-min mb-4 ${subject.color}/10`}>
                        <feature.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="font-semibold text-gray-800">{feature.name}</span>
                  </div>
                </button>
            ))}
        </div>
      </main>
    </div>
  );
};

export default SubjectDetail;
