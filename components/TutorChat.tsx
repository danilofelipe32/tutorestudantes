import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Subject, Message } from '../types';
import { getTutorResponse } from '../services/geminiService';
import { saveChatHistory } from '../services/chatHistoryService';
import { ArrowLeftIcon, SendIcon } from './Icons';

interface TutorChatProps {
  subject: Subject;
  onBack: () => void;
  learningGoal?: string;
  learningStyle?: string;
}

const TutorChat: React.FC<TutorChatProps> = ({ subject, onBack, learningGoal, learningStyle }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    let baseText = `Olá! Eu sou seu tutor de ${subject.name}.`;
    let hasCustomization = false;

    if (learningGoal) {
      baseText += ` Vamos focar no seu objetivo de "${learningGoal}".`;
      hasCustomization = true;
    }

    if (learningStyle) {
      baseText += ` E vou adaptar minhas explicações para um estilo mais ${learningStyle.toLowerCase()}.`;
      hasCustomization = true;
    }

    if (hasCustomization) {
      baseText += ' Como posso te ajudar a começar?';
    } else {
      baseText += ' Sobre o que você gostaria de conversar hoje?';
    }
    
    return [{ id: '1', text: baseText, sender: 'bot' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleBack = () => {
    // Apenas salva o histórico se houver mais do que a mensagem inicial e uma resposta.
    if (messages.length > 2) {
      saveChatHistory(subject.id, messages);
    }
    onBack();
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={handleBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
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
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${
              msg.sender === 'user' ? 'justify-end animate-chat-user' : 'justify-start animate-chat-bot'
            }`}>
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