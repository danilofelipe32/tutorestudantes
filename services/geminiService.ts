import { GoogleGenAI, type Content, Modality, Type } from "@google/genai";
import type { Subject, Difficulty, ExerciseQuestion, StudyTopic, Flashcard, Message } from '../types';
import { offlineExercises } from "../data/offlineExercises";

// AVISO: A chave de API está diretamente no código para fins de teste.
// Em um ambiente de produção, ela deve ser movida para uma variável de ambiente segura.
const GEMINI_API_KEY = "COLOQUE_SUA_CHAVE_DE_API_DO_GEMINI_AQUI";

// A biblioteca GoogleGenAI precisa de uma string não vazia para inicializar,
// caso contrário, o aplicativo falhará ao carregar.
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper to handle API errors and offline mode
async function safeApiCall<T>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
  // Se a chave de API for o valor padrão, retorne o fallback para evitar erros.
  if (GEMINI_API_KEY === "COLOQUE_SUA_CHAVE_DE_API_DO_GEMINI_AQUI") {
    console.warn("Chave de API do Gemini não configurada. Usando dados de fallback.");
    return fallback;
  }

  if (!navigator.onLine) {
    console.warn("Offline mode: using fallback.");
    return fallback;
  }
  try {
    return await apiCall();
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return fallback;
  }
}

export const generateExercise = async (
  subject: Subject,
  difficulty: Difficulty,
  isReview: boolean
): Promise<ExerciseQuestion | null> => {
  const fallback = () => {
    const subjectExercises = offlineExercises[subject.id];
    return subjectExercises ? subjectExercises[Math.floor(Math.random() * subjectExercises.length)] : null;
  };

  return safeApiCall(async () => {
    const reviewText = isReview ? 'Foque em um tópico que o aluno errou anteriormente ou que é fundamental.' : '';
    const prompt = `
      Crie uma questão de múltipla escolha sobre ${subject.name} para um estudante do ensino médio no Brasil.
      A questão deve ter 4 opções.
      Nível de dificuldade: ${difficulty}.
      ${reviewText}
      A explicação do porquê a resposta está correta deve ser clara, concisa e ter no máximo 2 frases.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "Um identificador único para a opção, ex: 'a', 'b', 'c', 'd'" },
                            text: { type: Type.STRING, description: "O texto da opção de múltipla escolha." }
                        },
                        required: ["id", "text"]
                    }
                },
                correctOptionId: { type: Type.STRING, description: "O 'id' da opção correta." },
                explanation: { type: Type.STRING, description: "Explicação do porquê a resposta está correta." }
            },
            required: ["question", "options", "correctOptionId", "explanation"]
          }
        }
    });

    const text = response.text.trim();
    return JSON.parse(text) as ExerciseQuestion;
  }, fallback());
};

export const getTutorResponse = async (
  subject: Subject,
  history: Content[],
  newPrompt: string,
  learningGoal?: string,
  learningStyle?: string,
): Promise<string> => {
    const fallback = "Desculpe, estou com problemas para me conectar. Tente novamente mais tarde.";

    return safeApiCall(async () => {
        let systemInstruction = `Você é um tutor de ${subject.name} amigável e prestativo para um estudante do ensino médio no Brasil. Fale em português brasileiro. Mantenha suas respostas concisas e guie o aluno a pensar, em vez de dar respostas diretas.`;

        if(learningGoal) systemInstruction += ` O objetivo do aluno é: "${learningGoal}".`;
        if(learningStyle) systemInstruction += ` Adapte seu estilo para ser mais ${learningStyle}.`;
        
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history,
            config: {
                systemInstruction,
            },
        });

        const response = await chat.sendMessage({ message: newPrompt });
        return response.text;
    }, fallback);
};

export const getDailyTip = async (subject: Subject): Promise<string | null> => {
    const fallback = "A consistência é a chave para o sucesso. Continue estudando um pouco a cada dia!";

    return safeApiCall(async () => {
        const prompt = `Crie uma dica de estudo rápida e motivacional (no máximo 2 frases) sobre ${subject.name} para um estudante do ensino médio.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }]
        });
        return response.text;
    }, fallback);
};

export const textToSpeech = async (text: string): Promise<string | null> => {
    return safeApiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    }, null);
}

export const generateStudyTopics = async (subject: Subject): Promise<StudyTopic[]> => {
    const fallback: StudyTopic[] = [
        { id: '1', title: `Fundamentos de ${subject.name}`, completed: false },
        { id: '2', title: `Tópicos Avançados de ${subject.name}`, completed: false }
    ];

    return safeApiCall(async () => {
        const prompt = `Liste 5 tópicos de estudo essenciais sobre ${subject.name} para o ensino médio.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const result = JSON.parse(response.text.trim()) as { title: string }[];
        // FIX: Explicitly type the returned object to conform to StudyTopic interface, resolving a type inference mismatch.
        return result.map((item, index): StudyTopic => ({
            id: `${Date.now()}-${index}`,
            title: item.title,
            completed: false
        }));
    }, fallback);
}

export const generateFlashcardsForTopic = async (topic: StudyTopic): Promise<Flashcard[]> => {
    const fallback: Flashcard[] = [{ id: '1', question: `O que é ${topic.title}?`, answer: 'Uma boa pergunta! Pesquise para descobrir.' }];
    
    return safeApiCall(async () => {
        const prompt = `Crie 3 flashcards (pergunta e resposta curta) sobre o tópico de estudo "${topic.title}".`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const result = JSON.parse(response.text.trim()) as { question: string; answer: string }[];
        return result.map((item, index) => ({
            id: `${Date.now()}-${index}`,
            ...item
        }));
    }, fallback);
};
