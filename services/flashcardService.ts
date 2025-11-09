import type { Flashcard } from '../types';

const FLASHCARD_DATA_KEY = 'tutorIaFlashcardData';

// Data is stored as: { [subjectId]: { [topicId]: Flashcard[] } }
type FlashcardData = Record<string, Record<string, Flashcard[]>>;

const getAllFlashcardData = (): FlashcardData => {
  try {
    const data = localStorage.getItem(FLASHCARD_DATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse flashcard data from localStorage", error);
    return {};
  }
};

const saveAllFlashcardData = (data: FlashcardData) => {
  try {
    localStorage.setItem(FLASHCARD_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save flashcard data to localStorage", error);
  }
};

export const getFlashcardsForTopic = (subjectId: string, topicId: string): Flashcard[] => {
  const allData = getAllFlashcardData();
  return allData[subjectId]?.[topicId] || [];
};

export const saveFlashcardsForTopic = (subjectId: string, topicId: string, flashcards: Flashcard[]) => {
  const allData = getAllFlashcardData();
  if (!allData[subjectId]) {
    allData[subjectId] = {};
  }
  allData[subjectId][topicId] = flashcards;
  saveAllFlashcardData(allData);
};


export const saveFlashcard = (subjectId: string, topicId: string, flashcard: Flashcard) => {
  const allData = getAllFlashcardData();
  if (!allData[subjectId]) allData[subjectId] = {};
  if (!allData[subjectId][topicId]) allData[subjectId][topicId] = [];
  
  const existingIndex = allData[subjectId][topicId].findIndex(f => f.id === flashcard.id);
  if (existingIndex > -1) {
    allData[subjectId][topicId][existingIndex] = flashcard;
  } else {
    allData[subjectId][topicId].unshift(flashcard);
  }
  saveAllFlashcardData(allData);
};

export const deleteFlashcard = (subjectId: string, topicId: string, flashcardId: string) => {
    const allData = getAllFlashcardData();
    if (!allData[subjectId]?.[topicId]) return;

    allData[subjectId][topicId] = allData[subjectId][topicId].filter(f => f.id !== flashcardId);
    saveAllFlashcardData(allData);
};