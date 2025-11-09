import type { StudyTopic } from '../types';

const STUDY_TOPICS_KEY = 'tutorIaStudyTopics';

type StudyTopicsData = Record<string, StudyTopic[]>;

// Obtém todos os tópicos de todas as matérias do localStorage.
const getAllTopics = (): StudyTopicsData => {
  try {
    const data = localStorage.getItem(STUDY_TOPICS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse study topics from localStorage", error);
    return {};
  }
};

// Salva todos os tópicos de todas as matérias no localStorage.
const saveAllTopics = (data: StudyTopicsData) => {
  try {
    localStorage.setItem(STUDY_TOPICS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save study topics to localStorage", error);
  }
};

// Obtém a lista de tópicos para uma matéria específica.
export const getTopicsForSubject = (subjectId: string): StudyTopic[] => {
  const allTopics = getAllTopics();
  return allTopics[subjectId] || [];
};

// Salva a lista de tópicos para uma matéria específica.
export const saveTopicsForSubject = (subjectId: string, topics: StudyTopic[]) => {
  const allTopics = getAllTopics();
  allTopics[subjectId] = topics;
  saveAllTopics(allTopics);
};
