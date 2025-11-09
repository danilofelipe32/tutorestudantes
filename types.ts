import type React from 'react';

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.FC<{ className?: string }>;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isTyping?: boolean;
}

export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';

export interface ExerciseQuestion {
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
}

export enum Screen {
  SUBJECT_LIST,
  SUBJECT_DETAIL,
  EXERCISE,
  TUTOR_CHAT,
  STUDY_SESSION,
  CHAT_HISTORY,
  EXERCISE_HISTORY,
  LIVE_TUTOR,
  STUDY_TOPICS,
  FLASHCARDS,
  COGNITIVE_FEATURES
}

export interface StudyTopic {
  id: string;
  title: string;
  completed: boolean;
  summary?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}
