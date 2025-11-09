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

export interface UserProfile {
  name: string;
  photo: string; // Base64 encoded image
  dob: string;   // ISO date string (e.g., "YYYY-MM-DD")
  grade: string; // e.g., "1º Ano - Ensino Médio"
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
  COGNITIVE_FEATURES,
  USER_PROFILE
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