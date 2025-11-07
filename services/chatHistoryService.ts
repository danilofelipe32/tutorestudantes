import type { Message } from '../types';

const CHAT_HISTORY_KEY = 'tutorIaChatHistory';

export interface ChatHistoryItem {
  id: string;
  date: string;
  messages: Message[];
}

type ChatHistory = Record<string, ChatHistoryItem[]>;

export const getAllChatHistory = (): ChatHistory => {
  try {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse chat history from localStorage", error);
    return {};
  }
};

const saveAllChatHistory = (data: ChatHistory) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save chat history to localStorage", error);
  }
};

export const getChatHistoryForSubject = (subjectId: string): ChatHistoryItem[] => {
  const allHistory = getAllChatHistory();
  return allHistory[subjectId] || [];
};

export const saveChatHistory = (subjectId: string, messages: Message[]) => {
  if (messages.length <= 2) return; // Não salva conversas sem interação do usuário

  const allHistory = getAllChatHistory();
  const subjectHistory = allHistory[subjectId] || [];
  
  const newChatItem: ChatHistoryItem = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    messages,
  };

  subjectHistory.unshift(newChatItem); // Adiciona no início para mostrar os mais recentes primeiro
  allHistory[subjectId] = subjectHistory;

  saveAllChatHistory(allHistory);
};