import React, { useState, useEffect, useCallback } from 'react';
import type { Subject, StudyTopic } from '../types';
import { Screen } from '../types';
import { getTopicsForSubject, saveTopicsForSubject } from '../services/studyTopicsService';
import { generateStudyTopics } from '../services/geminiService';
import { ArrowLeftIcon, PlusIcon, SparklesIcon, TrashIcon, CheckCircleIcon, ChevronRightIcon } from './Icons';

interface StudyTopicsProps {
  subject: Subject;
  onBack: () => void;
  onNavigateTo: (screen: Screen, topic: StudyTopic) => void;
}

const StudyTopics: React.FC<StudyTopicsProps> = ({ subject, onBack, onNavigateTo }) => {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadTopics = useCallback(() => {
    setIsLoading(true);
    const storedTopics = getTopicsForSubject(subject.id);
    setTopics(storedTopics);
    setIsLoading(false);
  }, [subject.id]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleSave = (updatedTopics: StudyTopic[]) => {
    setTopics(updatedTopics);
    saveTopicsForSubject(subject.id, updatedTopics);
  };

  const handleAddTopic = () => {
    if (newTopicTitle.trim() === '') return;
    const newTopic: StudyTopic = {
      id: Date.now().toString(),
      title: newTopicTitle.trim(),
      completed: false,
    };
    handleSave([newTopic, ...topics]);
    setNewTopicTitle('');
  };

  const handleToggleComplete = (topicId: string) => {
    const updatedTopics = topics.map(t =>
      t.id === topicId ? { ...t, completed: !t.completed } : t
    );
    handleSave(updatedTopics);
  };

  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = topics.filter(t => t.id !== topicId);
    handleSave(updatedTopics);
  };

  const handleGenerateWithAI = async () => {
    setIsLoading(true);
    const generatedTopics = await generateStudyTopics(subject);
    handleSave([...generatedTopics, ...topics]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="font-semibold text-lg text-gray-800">Tópicos de Estudo: {subject.name}</h1>
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder="Adicionar novo tópico..."
                className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleAddTopic} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            <button
                onClick={handleGenerateWithAI}
                disabled={isLoading}
                className="w-full mt-3 flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Sugerir Tópicos com IA
            </button>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : topics.length === 0 ? (
            <p className="text-center text-gray-500 pt-8">Nenhum tópico ainda. Adicione um ou use a IA!</p>
          ) : (
            <ul className="space-y-2">
              {topics.map(topic => (
                <li key={topic.id} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <button onClick={() => handleToggleComplete(topic.id)} className="p-2">
                    <CheckCircleIcon className={`h-6 w-6 transition-colors ${topic.completed ? 'text-green-500' : 'text-gray-300'}`} />
                  </button>
                  <span className={`flex-grow mx-2 ${topic.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {topic.title}
                  </span>
                  <button onClick={() => onNavigateTo(Screen.FLASHCARDS, topic)} className="p-2 text-gray-400 hover:text-blue-500">
                    <ChevronRightIcon className="h-5 w-5"/>
                  </button>
                  <button onClick={() => handleDeleteTopic(topic.id)} className="p-2 text-gray-400 hover:text-red-500">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudyTopics;
