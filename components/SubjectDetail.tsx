
import React, {useState, useEffect} from 'react';
import type { Subject } from '../types';
import { Screen } from '../types';
import { getChatHistoryForSubject } from '../services/chatHistoryService';
import { ArrowLeftIcon, ChatBubbleIcon, PencilIcon, InfoIcon, ChevronRightIcon, ClockIcon, ArchiveBoxIcon, MicrophoneIcon } from './Icons';

interface SubjectDetailProps {
  subject: Subject;
  onNavigateTo: (screen: Screen, options?: { goal?: string; style?: string }) => void;
  onBack: () => void;
}

const getGradientClasses = (colorClass: string) => {
  switch (colorClass) {
    case 'bg-brand-red': return 'from-brand-red to-red-500';
    case 'bg-brand-green': return 'from-brand-green to-green-500';
    case 'bg-brand-teal': return 'from-brand-teal to-teal-500';
    case 'bg-brand-orange': return 'from-brand-orange to-orange-400';
    case 'bg-brand-lime': return 'from-brand-lime to-lime-500';
    case 'bg-brand-purple': return 'from-brand-purple to-purple-500';
    default: return colorClass;
  }
};

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, onNavigateTo, onBack }) => {
  const [learningGoal, setLearningGoal] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const history = getChatHistoryForSubject(subject.id);
    setHasHistory(history.length > 0);
  }, [subject.id]);

  const actionButtons = [
    {
      screen: Screen.TUTOR_CHAT,
      icon: ChatBubbleIcon,
      iconBg: 'bg-blue-500',
      title: 'Conversar com Tutor',
      subtitle: 'Tire suas dúvidas com um tutor inteligente',
      options: { goal: learningGoal, style: learningStyle },
      show: true
    },
    {
      screen: Screen.LIVE_TUTOR,
      icon: MicrophoneIcon,
      iconBg: 'bg-red-500',
      title: 'Conversar por Voz',
      subtitle: 'Interaja com o tutor em tempo real',
      show: true
    },
    {
      screen: Screen.STUDY_SESSION,
      icon: ClockIcon,
      iconBg: 'bg-orange-500',
      title: 'Sessão de Estudo',
      subtitle: 'Foco total com timer (Pomodoro)',
      show: true
    },
    {
      screen: Screen.EXERCISE,
      icon: PencilIcon,
      iconBg: 'bg-green-500',
      title: 'Fazer Exercícios',
      subtitle: 'Pratique com exercícios interativos',
      show: true
    },
    {
      screen: Screen.CHAT_HISTORY,
      icon: ArchiveBoxIcon,
      iconBg: 'bg-purple-500',
      title: 'Histórico de Conversas',
      subtitle: 'Reveja seus bate-papos anteriores',
      show: hasHistory
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <header className={`p-6 text-white bg-gradient-to-br ${getGradientClasses(subject.color)} rounded-b-3xl`}>
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
                <p className="text-base opacity-90">{subject.description}</p>
            </div>
        </div>
      </header>
      
      <main className="p-6 flex-grow bg-white overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Como você quer estudar?</h2>
        
        <div className="space-y-4">
          {actionButtons.filter(btn => btn.show).map((button, index) => (
            <button 
              key={button.title}
              onClick={() => onNavigateTo(button.screen, button.options)}
              className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center">
                  <div className={`p-3 ${button.iconBg} rounded-xl`}>
                      <button.icon className="h-6 w-6 text-white"/>
                  </div>
                  <div className="ml-4 text-left">
                      <p className="font-semibold text-gray-800">{button.title}</p>
                      <p className="text-sm text-gray-500">{button.subtitle}</p>
                  </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
        
        {/* Seção de Personalização */}
        <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Personalize sua sessão</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="learning-goal" className="block text-sm font-medium text-gray-700 mb-1">Objetivo de aprendizado (opcional)</label>
                    <input
                        id="learning-goal"
                        type="text"
                        value={learningGoal}
                        onChange={(e) => setLearningGoal(e.target.value)}
                        placeholder="Ex: Entender a 2ª Lei de Newton"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de aprendizado (opcional)</label>
                     <div className="grid grid-cols-3 gap-2">
                        {['Visual', 'Auditivo', 'Cinestésico'].map(style => (
                            <button
                            key={style}
                            onClick={() => setLearningStyle(prev => prev === style ? '' : style)}
                            className={`py-2 px-2 text-sm rounded-md font-semibold transition-colors border-2 ${
                                learningStyle === style
                                ? `${subject.color.replace('bg-', 'border-').replace('brand', 'blue-500')} ${subject.color.replace('bg-','bg-')}/10 text-${subject.color.replace('bg-', '')}-700`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
                            }`}
                            >
                            {style}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start">
            <InfoIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
            <div className="ml-3">
                <h4 className="font-semibold text-blue-800">Dica</h4>
                <p className="text-sm text-blue-700">Personalize sua sessão antes de conversar com o tutor para uma ajuda mais focada!</p>
            </div>
        </div>
      </main>
    </div>
  );
};

export default SubjectDetail;
