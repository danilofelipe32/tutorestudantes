import React, { useState } from 'react';
import type { Subject, StudyTopic } from './types';
import { Screen } from './types';
import SubjectList from './components/SubjectList';
import SubjectDetail from './components/SubjectDetail';
import Exercise from './components/Exercise';
import TutorChat from './components/TutorChat';
import StudySession from './components/StudySession';
import ChatHistory from './components/ChatHistory';
import ExerciseHistory from './components/ExerciseHistory';
import LiveTutor from './components/LiveTutor';
import StudyTopics from './components/StudyTopics';
import Flashcards from './components/Flashcards';
import CognitiveFeatures from './components/CognitiveFeatures';
import UserProfile from './components/UserProfile';
import { setupNotificationChecks } from './services/notificationService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.SUBJECT_LIST);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);

  React.useEffect(() => {
    setupNotificationChecks();
  }, []);

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setScreen(Screen.SUBJECT_DETAIL);
  };
  
  const handleNavigateTo = (newScreen: Screen, topic?: StudyTopic) => {
    if (topic) {
        setSelectedTopic(topic);
    }
    setScreen(newScreen);
  };

  const handleBack = () => {
    if ([Screen.FLASHCARDS].includes(screen)) {
        setScreen(Screen.STUDY_TOPICS);
        setSelectedTopic(null);
    } else if (screen === Screen.SUBJECT_DETAIL) {
      setScreen(Screen.SUBJECT_LIST);
      setSelectedSubject(null);
    } else if (screen === Screen.USER_PROFILE) {
      setScreen(Screen.SUBJECT_LIST);
    } else if (screen !== Screen.SUBJECT_LIST) {
      setScreen(Screen.SUBJECT_DETAIL);
    }
  };

  const renderScreen = () => {
    // Telas que não precisam de uma matéria selecionada
    if (screen === Screen.SUBJECT_LIST) {
      return <SubjectList onSelectSubject={handleSelectSubject} onNavigateTo={handleNavigateTo} />;
    }
    if (screen === Screen.USER_PROFILE) {
      return <UserProfile onBack={handleBack} />;
    }

    // A partir daqui, todas as telas precisam de uma matéria. Se não houver, volta para a lista.
    if (!selectedSubject) {
      return <SubjectList onSelectSubject={handleSelectSubject} onNavigateTo={handleNavigateTo} />;
    }
    
    switch (screen) {
      case Screen.SUBJECT_DETAIL:
        return <SubjectDetail subject={selectedSubject} onBack={handleBack} onNavigateTo={handleNavigateTo} />;
      case Screen.EXERCISE:
        return <Exercise subject={selectedSubject} onBack={handleBack} />;
      case Screen.TUTOR_CHAT:
        return <TutorChat subject={selectedSubject} onBack={handleBack} />;
      case Screen.STUDY_SESSION:
        return <StudySession subject={selectedSubject} onBack={handleBack} onNavigateTo={handleNavigateTo} />;
      case Screen.CHAT_HISTORY:
        return <ChatHistory subject={selectedSubject} onBack={handleBack} />;
      case Screen.EXERCISE_HISTORY:
        return <ExerciseHistory subject={selectedSubject} onBack={handleBack} />;
      case Screen.LIVE_TUTOR:
          return <LiveTutor subject={selectedSubject} onBack={handleBack} />;
      case Screen.STUDY_TOPICS:
          return <StudyTopics subject={selectedSubject} onBack={handleBack} onNavigateTo={handleNavigateTo}/>;
      case Screen.FLASHCARDS:
          if (!selectedTopic) {
            return <StudyTopics subject={selectedSubject} onBack={handleBack} onNavigateTo={handleNavigateTo}/>;
          }
          return <Flashcards subject={selectedSubject} topic={selectedTopic} onBack={handleBack} />;
      case Screen.COGNITIVE_FEATURES:
          return <CognitiveFeatures subjectColor={selectedSubject.color} onBack={handleBack} />;
      default:
        return <SubjectList onSelectSubject={handleSelectSubject} onNavigateTo={handleNavigateTo} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 font-sans antialiased overflow-hidden">
      <div className="max-w-md mx-auto h-full bg-white shadow-lg relative">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;