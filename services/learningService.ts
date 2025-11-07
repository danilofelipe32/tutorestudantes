import type { Difficulty } from '../types';

const LEARNING_DATA_KEY = 'tutorIaLearningData';

const difficultyLevels: Difficulty[] = ['Fácil', 'Médio', 'Difícil'];

interface SubjectLearningData {
  currentDifficulty: Difficulty;
  nextReviewDate: number;
  intervalDays: number;
}

type LearningData = Record<string, SubjectLearningData>;

const getAllLearningData = (): LearningData => {
  try {
    const data = localStorage.getItem(LEARNING_DATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse learning data from localStorage", error);
    return {};
  }
};

const saveAllLearningData = (data: LearningData) => {
  try {
    localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save learning data to localStorage", error);
  }
};

export const getLearningDataForSubject = (subjectId: string): SubjectLearningData => {
  const allData = getAllLearningData();
  return allData[subjectId] || {
    currentDifficulty: 'Fácil',
    nextReviewDate: 0,
    intervalDays: 1,
  };
};

export const updateLearningDataForSubject = (subjectId: string, isCorrect: boolean) => {
  const allData = getAllLearningData();
  const currentData = getLearningDataForSubject(subjectId);

  let nextDifficulty = currentData.currentDifficulty;
  let nextIntervalDays = currentData.intervalDays;

  const currentDifficultyIndex = difficultyLevels.indexOf(currentData.currentDifficulty);

  if (isCorrect) {
    if (currentDifficultyIndex < difficultyLevels.length - 1) {
      nextDifficulty = difficultyLevels[currentDifficultyIndex + 1];
    }
    nextIntervalDays = Math.max(1, currentData.intervalDays * 2);
  } else {
    if (currentDifficultyIndex > 0) {
      nextDifficulty = difficultyLevels[currentDifficultyIndex - 1];
    }
    nextIntervalDays = 1; // Reset interval on incorrect answer
  }
  
  const now = new Date();
  const nextReviewDate = new Date(now.setDate(now.getDate() + nextIntervalDays)).getTime();

  allData[subjectId] = {
    currentDifficulty: nextDifficulty,
    intervalDays: nextIntervalDays,
    nextReviewDate,
  };

  saveAllLearningData(allData);
};


export const getReviewSchedule = (): Record<string, { needsReview: boolean }> => {
    const allData = getAllLearningData();
    const schedule: Record<string, { needsReview: boolean }> = {};
    const now = Date.now();

    for (const subjectId in allData) {
        const data = allData[subjectId];
        schedule[subjectId] = {
            needsReview: data.nextReviewDate > 0 && now >= data.nextReviewDate
        };
    }
    return schedule;
}
