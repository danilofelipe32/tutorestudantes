import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Subject, Message } from '../types';
import { getTutorResponse } from '../services/geminiService';
import { ArrowLeftIcon, SendIcon, CogIcon } from './Icons';

interface TutorChatProps {
  subject: Subject;
  onBack: () => void;
}

const TutorChat: React.FC<TutorChatProps> = ({ subject, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Olá! Eu sou seu tutor de ${subject.name}. Estou aqui para ajudar você a aprender e tirar suas dúvidas. Como posso ajudar você hoje?`, sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [learningGoal, setLearningGoal] = useState('');
  const [learningStyle, setLearningStyle] = useState(''); // 'Visual', 'Auditivo', 'Cinestésico', or ''

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage, { id: 'typing', text: '...', sender: 'bot', isTyping: true }]);
    setInput('');
    setIsLoading(true);

    const messageHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));

    const botResponseText = await getTutorResponse(subject, messageHistory, input, learningGoal, learningStyle);

    const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot' };
    setMessages(prev => prev.filter(m => !m.isTyping).concat(botMessage));
    setIsLoading(false);
  }, [input, isLoading, messages, subject, learningGoal, learningStyle]);

  const SettingsModal = () => {
    const [tempGoal, setTempGoal] = useState(learningGoal);
    const [tempStyle, setTempStyle] = useState(learningStyle);

    const handleSave = () => {
      setLearningGoal(tempGoal);
      setLearningStyle(tempStyle);
      setIsSettingsOpen(false);
    };

    if (!isSettingsOpen) return null;

    return (
      <div className="absolute inset-0 bg-black/60 flex justify-center items-center z-20 p-4" onClick={() => setIsSettingsOpen(false)}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-gray-800 mb-5">Personalizar Sessão</h2>
          
          <div className="mb-6">
            <label htmlFor="learning-goal" className="block text-sm font-medium text-gray-700 mb-2">Qual é o seu objetivo de hoje?</label>
            <input
              id="learning-goal"
              type="text"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              placeholder="Ex: Entender a 2ª Lei de Newton"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Qual seu estilo de aprendizado?</label>
            <div className="grid grid-cols-3 gap-2">
              {['Visual', 'Auditivo', 'Cinestésico'].map(style => (
                <button
                  key={style}
                  onClick={() => setTempStyle(prev => prev === style ? '' : style)}
                  className={`py-2 px-2 text-sm rounded-md font-semibold transition-colors border-2 ${
                    tempStyle === style
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Salvar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <SettingsModal />
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
          <div className={'p-2 rounded-full ' + subject.color + '/20'}>
            <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
          </div>
          <div className="ml-3">
            <h1 className="font-semibold text-lg text-gray-800">Tutor de {subject.name}</h1>
            <p className="text-sm text-green-500">Online</p>
          </div>
        </div>
         <button onClick={() => setIsSettingsOpen(true)} className="ml-auto p-2 rounded-full hover:bg-gray-100" aria-label="Personalizar sessão">
          <CogIcon className="h-6 w-6 text-gray-600" />
        </button>
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-gray-200 text-gray-800 rounded-bl-lg'
              }`}>
                {msg.isTyping ? (
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                ) : (
                    <p className="text-sm">{msg.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex items-center bg-gray-100 rounded-full p-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua pergunta..."
            className="w-full bg-transparent px-4 py-2 text-gray-800 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
            className="p-2 bg-blue-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            <SendIcon className="h-6 w-6 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default TutorChat;