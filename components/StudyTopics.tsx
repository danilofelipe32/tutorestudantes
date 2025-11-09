import React, { useState, useEffect } from 'react';
import type { Subject, StudyTopic } from '../types';
import { getTopicsForSubject, saveTopicsForSubject } from '../services/studyTopicsService';
import { ArrowLeftIcon, TrashIcon, ClipboardDocumentListIcon } from './Icons';

interface StudyTopicsProps {
  subject: Subject;
  onBack: () => void;
}

const StudyTopics: React.FC<StudyTopicsProps> = ({ subject, onBack }) => {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [newTopicText, setNewTopicText] = useState('');

  useEffect(() => {
    const loadedTopics = getTopicsForSubject(subject.id);
    setTopics(loadedTopics);
  }, [subject.id]);

  const handleSave = (updatedTopics: StudyTopic[]) => {
    setTopics(updatedTopics);
    saveTopicsForSubject(subject.id, updatedTopics);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicText.trim() === '') return;

    const newTopic: StudyTopic = {
      id: Date.now().toString(),
      text: newTopicText.trim(),
      isCompleted: false,
    };

    handleSave([newTopic, ...topics]);
    setNewTopicText('');
  };

  const handleToggleComplete = (topicId: string) => {
    const updatedTopics = topics.map(topic =>
      topic.id === topicId ? { ...topic, isCompleted: !topic.isCompleted } : topic
    );
    handleSave(updatedTopics);
  };

  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = topics.filter(topic => topic.id !== topicId);
    handleSave(updatedTopics);
  };
  
  const completedTopics = topics.filter(t => t.isCompleted);
  const pendingTopics = topics.filter(t => !t.isCompleted);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
          <div className={'p-2 rounded-full ' + subject.color + '/20'}>
            <ClipboardDocumentListIcon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
          </div>
          <h1 className="font-semibold text-lg ml-3 text-gray-800">Tópicos de {subject.name}</h1>
        </div>
      </header>
      
      <main className="flex-grow p-6 overflow-y-auto">
        <form onSubmit={handleAddTopic} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopicText}
              onChange={(e) => setNewTopicText(e.target.value)}
              placeholder="Adicionar novo tópico..."
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!newTopicText.trim()}
            >
              Adicionar
            </button>
          </div>
        </form>

        {topics.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">
            <ClipboardDocumentListIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold">Sua lista está vazia</h3>
            <p>Adicione tópicos acima para começar a organizar seus estudos.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
                <h2 className="font-bold text-gray-700 mb-2">A Fazer ({pendingTopics.length})</h2>
                <ul className="space-y-2">
                {pendingTopics.map((topic, index) => (
                    <li
                    key={topic.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                    >
                    <input
                        type="checkbox"
                        checked={topic.isCompleted}
                        onChange={() => handleToggleComplete(topic.id)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
                    />
                    <span className="flex-grow text-gray-800">{topic.text}</span>
                    <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                        aria-label="Remover tópico"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                    </li>
                ))}
                </ul>
            </div>
            {completedTopics.length > 0 && (
                <div>
                    <h2 className="font-bold text-gray-700 mb-2">Concluídos ({completedTopics.length})</h2>
                    <ul className="space-y-2">
                    {completedTopics.map(topic => (
                        <li
                        key={topic.id}
                        className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                        <input
                            type="checkbox"
                            checked={topic.isCompleted}
                            onChange={() => handleToggleComplete(topic.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
                        />
                        <span className="flex-grow text-gray-500 line-through">{topic.text}</span>
                        <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                            aria-label="Remover tópico"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                        </li>
                    ))}
                    </ul>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyTopics;
