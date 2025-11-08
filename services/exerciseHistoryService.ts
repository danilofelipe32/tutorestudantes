import type { ExerciseQuestion } from '../types';

const EXERCISE_HISTORY_KEY = 'tutorIaExerciseHistory';

export interface ExerciseHistoryItem {
  id: string;
  date: string;
  question: ExerciseQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
}

type ExerciseHistory = Record<string, ExerciseHistoryItem[]>;

export const getAllExerciseHistory = (): ExerciseHistory => {
  try {
    const data = localStorage.getItem(EXERCISE_HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse exercise history from localStorage", error);
    return {};
  }
};

const saveAllExerciseHistory = (data: ExerciseHistory) => {
  try {
    localStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save exercise history to localStorage", error);
  }
};

export const getExerciseHistoryForSubject = (subjectId: string): ExerciseHistoryItem[] => {
  const allHistory = getAllExerciseHistory();
  return allHistory[subjectId] || [];
};

export const saveExerciseAttempt = (subjectId: string, question: ExerciseQuestion, selectedOptionId: string, isCorrect: boolean) => {
  const allHistory = getAllExerciseHistory();
  const subjectHistory = allHistory[subjectId] || [];
  
  const newAttempt: ExerciseHistoryItem = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    question,
    selectedOptionId,
    isCorrect,
  };

  subjectHistory.unshift(newAttempt); // Adiciona no início para mostrar os mais recentes primeiro
  
  // Limita o histórico para as últimas 50 questões por matéria para não sobrecarregar o localStorage
  if (subjectHistory.length > 50) {
    subjectHistory.pop();
  }

  allHistory[subjectId] = subjectHistory;

  saveAllExerciseHistory(allHistory);
};
