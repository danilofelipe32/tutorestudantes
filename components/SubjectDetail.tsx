
import React, {useState, useEffect} from 'react';
import type { Subject } from '../types';
import { Screen } from '../types';
import { getChatHistoryForSubject } from '../services/chatHistoryService';
import { ArrowLeftIcon, ChatBubbleIcon, PencilIcon, InfoIcon, ChevronRightIcon, ClockIcon, ArchiveBoxIcon } from './Icons';

interface SubjectDetailProps {
  subject: Subject;
  onNavigateTo: (screen: Screen, options?: { goal?: string; style?: string }) => void;
  onBack: () => void;
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, onNavigateTo, onBack }) => {
  const [learningGoal, setLearningGoal] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const history = getChatHistoryForSubject(subject.id);
    setHasHistory(history.length > 0);
  }, [subject.id]);

  return (
    <div className="flex flex-col h-screen">
      <header className={`p-6 text-white ${subject.color} rounded-b-3xl`}>
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
            <button 
                onClick={() => onNavigateTo(Screen.TUTOR_CHAT, { goal: learningGoal, style: learningStyle })}
                className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors"
            >
                <div className="flex items-center">
                    <div className="p-3 bg-blue-500 rounded-xl">
                        <ChatBubbleIcon className="h-6 w-6 text-white"/>
                    </div>
                    <div className="ml-4 text-left">
                        <p className="font-semibold text-gray-800">Conversar com Tutor</p>
                        <p className="text-sm text-gray-500">Tire suas dúvidas com um tutor inteligente</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>

            <button
                onClick={() => onNavigateTo(Screen.STUDY_SESSION)}
                className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors"
            >
                <div className="flex items-center">
                     <div className="p-3 bg-orange-500 rounded-xl">
                        <ClockIcon className="h-6 w-6 text-white"/>
                    </div>
                    <div className="ml-4 text-left">
                        <p className="font-semibold text-gray-800">Sessão de Estudo</p>
                        <p className="text-sm text-gray-500">Foco total com timer (Pomodoro)</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>

            <button 
                onClick={() => onNavigateTo(Screen.EXERCISE)}
                className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors"
            >
                <div className="flex items-center">
                     <div className="p-3 bg-green-500 rounded-xl">
                        <PencilIcon className="h-6 w-6 text-white"/>
                    </div>
                    <div className="ml-4 text-left">
                        <p className="font-semibold text-gray-800">Fazer Exercícios</p>
                        <p className="text-sm text-gray-500">Pratique com exercícios interativos</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>

            {hasHistory && (
              <button 
                  onClick={() => onNavigateTo(Screen.CHAT_HISTORY)}
                  className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                  <div className="flex items-center">
                      <div className="p-3 bg-purple-500 rounded-xl">
                          <ArchiveBoxIcon className="h-6 w-6 text-white"/>
                      </div>
                      <div className="ml-4 text-left">
                          <p className="font-semibold text-gray-800">Histórico de Conversas</p>
                          <p className="text-sm text-gray-500">Reveja seus bate-papos anteriores</p>
                      </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            )}
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