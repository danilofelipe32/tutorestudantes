

import React, { useState, useCallback, useEffect } from 'react';
import type { Subject } from './types';
import { Screen } from './types';
import SubjectList from './components/SubjectList';
import SubjectDetail from './components/SubjectDetail';
import TutorChat from './components/TutorChat';
import Exercise from './components/Exercise';
import StudySession from './components/StudySession';
import ChatHistory from './components/ChatHistory';
import LiveTutor from './components/LiveTutor';
import { setupNotificationChecks } from './services/notificationService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.SUBJECT_LIST);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [learningGoal, setLearningGoal] = useState<string>('');
  const [learningStyle, setLearningStyle] = useState<string>('');

  useEffect(() => {
    // Configura o verificador de notificações quando o aplicativo é carregado.
    // Isso só será executado se a permissão já tiver sido concedida.
    // A solicitação de permissão é tratada no componente SubjectList.
    setupNotificationChecks();
  }, []);

  const handleSelectSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setScreen(Screen.SUBJECT_DETAIL);
  }, []);

  const handleNavigateTo = useCallback((newScreen: Screen, options?: { goal?: string; style?: string }) => {
    if (options) {
      setLearningGoal(options.goal || '');
      setLearningStyle(options.style || '');
    }
    setScreen(newScreen);
  }, []);

  const handleBack = useCallback(() => {
    if (screen === Screen.TUTOR_CHAT || screen === Screen.EXERCISE || screen === Screen.STUDY_SESSION || screen === Screen.CHAT_HISTORY || screen === Screen.LIVE_TUTOR) {
      setScreen(Screen.SUBJECT_DETAIL);
    } else if (screen === Screen.SUBJECT_DETAIL) {
      setScreen(Screen.SUBJECT_LIST);
      setSelectedSubject(null);
      setLearningGoal('');
      setLearningStyle('');
    }
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case Screen.SUBJECT_LIST:
        return <SubjectList onSelectSubject={handleSelectSubject} />;
      case Screen.SUBJECT_DETAIL:
        if (selectedSubject) {
          return (
            <SubjectDetail
              subject={selectedSubject}
              onNavigateTo={handleNavigateTo}
              onBack={handleBack}
            />
          );
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      case Screen.TUTOR_CHAT:
        if (selectedSubject) {
          return (
            <TutorChat 
              subject={selectedSubject} 
              onBack={handleBack} 
              learningGoal={learningGoal}
              learningStyle={learningStyle}
            />
          );
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      case Screen.EXERCISE:
        if (selectedSubject) {
          return <Exercise subject={selectedSubject} onBack={handleBack} />;
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      case Screen.STUDY_SESSION:
        if (selectedSubject) {
          return <StudySession subject={selectedSubject} onBack={handleBack} onNavigateTo={handleNavigateTo} />;
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      case Screen.CHAT_HISTORY:
        if (selectedSubject) {
          return <ChatHistory subject={selectedSubject} onBack={handleBack} />;
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      case Screen.LIVE_TUTOR:
        if (selectedSubject) {
          return <LiveTutor subject={selectedSubject} onBack={handleBack} />;
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      default:
        return <SubjectList onSelectSubject={handleSelectSubject} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto bg-white h-screen shadow-lg flex flex-col">
        <main key={screen} className="animate-fade-in flex-grow">
          {renderScreen()}
        </main>
        <footer className="p-3 text-center text-sm text-gray-500 bg-white border-t border-gray-100 flex-shrink-0">
          <a href="https://wa.me/5584999780963" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
            Produzido por Danilo Arruda
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;