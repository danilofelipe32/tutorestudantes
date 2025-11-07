import type { ComponentType } from 'react';

export enum Screen {
  SUBJECT_LIST,
  SUBJECT_DETAIL,
  TUTOR_CHAT,
  EXERCISE,
  STUDY_SESSION,
  CHAT_HISTORY,
  LIVE_TUTOR,
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  // FIX: Use imported ComponentType
  icon: ComponentType<{ className?: string }>;
}

export interface Message {
  id:string;
  text: string;
  sender: 'user' | 'bot';
  isTyping?: boolean;
}

export interface ExerciseQuestion {
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
}

export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';