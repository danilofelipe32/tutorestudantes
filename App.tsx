
import React, { useState, useCallback, useEffect } from 'react';
import type { Subject } from './types';
import { Screen } from './types';
import SubjectList from './components/SubjectList';
import SubjectDetail from './components/SubjectDetail';
import TutorChat from './components/TutorChat';
import Exercise from './components/Exercise';
import { setupNotificationChecks } from './services/notificationService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.SUBJECT_LIST);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

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

  const handleNavigateTo = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
  }, []);

  const handleBack = useCallback(() => {
    if (screen === Screen.TUTOR_CHAT || screen === Screen.EXERCISE) {
      setScreen(Screen.SUBJECT_DETAIL);
    } else if (screen === Screen.SUBJECT_DETAIL) {
      setScreen(Screen.SUBJECT_LIST);
      setSelectedSubject(null);
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
          return <TutorChat subject={selectedSubject} onBack={handleBack} />;
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      case Screen.EXERCISE:
        if (selectedSubject) {
          return <Exercise subject={selectedSubject} onBack={handleBack} />;
        }
        return <SubjectList onSelectSubject={handleSelectSubject} />; // Fallback
      default:
        return <SubjectList onSelectSubject={handleSelectSubject} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
