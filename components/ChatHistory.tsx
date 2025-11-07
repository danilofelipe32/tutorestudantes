
import React, { useState, useEffect, useRef } from 'react';
import type { Subject, Message } from '../types';
import { getChatHistoryForSubject, ChatHistoryItem } from '../services/chatHistoryService';
import { ArrowLeftIcon, ChevronRightIcon } from './Icons';

interface ChatHistoryProps {
  subject: Subject;
  onBack: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ subject, onBack }) => {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatHistoryItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const subjectHistory = getChatHistoryForSubject(subject.id);
    setHistory(subjectHistory);
  }, [subject.id]);

  useEffect(() => {
    if (selectedChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [selectedChat]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (selectedChat) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
          <button onClick={() => setSelectedChat(null)} className="mr-2 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center">
            <div className={'p-2 rounded-full ' + subject.color + '/20'}>
              <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
            </div>
            <div className="ml-3">
              <h1 className="font-semibold text-lg text-gray-800">Histórico de {subject.name}</h1>
              <p className="text-sm text-gray-500">{formatDate(selectedChat.date)}</p>
            </div>
          </div>
        </header>
        <main className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {selectedChat.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-gray-200 text-gray-800 rounded-bl-lg'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
            <div className={'p-2 rounded-full ' + subject.color + '/20'}>
                <subject.icon className={`h-6 w-6 ${subject.color.replace('bg-', 'text-')}`} />
            </div>
            <h1 className="font-semibold text-lg text-gray-800 ml-3">Histórico de {subject.name}</h1>
        </div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>Nenhuma conversa encontrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(chatItem => (
              <button 
                key={chatItem.id}
                onClick={() => setSelectedChat(chatItem)}
                className="w-full flex items-center justify-between p-5 bg-gray-100 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-colors text-left"
              >
                <div>
                    <p className="font-semibold text-gray-800">Conversa de {formatDate(chatItem.date)}</p>
                    <p className="text-sm text-gray-500 mt-1 truncate">{chatItem.messages[1]?.text || '...'}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatHistory;
