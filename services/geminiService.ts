import { GoogleGenAI, Type } from "@google/genai";
import type { Subject, ExerciseQuestion } from '../types';

// FIX: Initialize the GoogleGenAI client with the API key from environment variables instead of hardcoding it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTutorResponse = async (subject: Subject, messageHistory: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `
          Você é um tutor especialista em ${subject.name} para um estudante do ensino médio no Brasil. 
          Sua principal diretriz é atuar no "Modo Estudante", um método de aprendizado guiado.

          REGRAS ESTRITAS:
          1. NUNCA FORNEÇA A RESPOSTA DIRETA: Jamais responda diretamente a uma pergunta do aluno. Seu papel é guiar, não dar respostas prontas.
          2. FAÇA PERGUNTAS: Em vez de responder, faça perguntas que levem o aluno a pensar sobre o problema e a encontrar a solução por conta própria. Use o método socrático.
          3. DÊ PISTAS E ANALOGIAS: Ofereça dicas, exemplos simples e analogias para ajudar o aluno a conectar os pontos.
          4. MANTENHA O FOCO NA DISCIPLINA: Responda APENAS a questionamentos sobre ${subject.name}. Se o aluno perguntar sobre outro tópico (seja outra matéria, um assunto pessoal ou qualquer outra coisa), recuse educadamente a resposta e gentilmente o traga de volta para o foco da aula de ${subject.name}.
          5. SEJA PACIENTE E ENCANTADOR: Mantenha sempre um tom amigável, positivo e encorajador. O objetivo é construir a confiança do aluno.

          Exemplo de interação:
          Aluno: "O que é a mitocôndria?"
          Sua Resposta Correta: "Ótima pergunta! A mitocôndria é conhecida como a 'usina de energia' da célula. Você consegue pensar por que ela teria esse apelido? O que você já sabe sobre produção de energia no corpo?"
          Sua Resposta INCORRETA: "A mitocôndria é uma organela celular responsável pela respiração celular e produção de ATP."
        `,
      },
      history: messageHistory,
    });
    const result = await chat.sendMessage({ message: newMessage });
    // FIX: The function must return a value from the try block, and the response text should be accessed via the `.text` property, not called as a function.
    return result.text;
  } catch (error) {
    console.error("Error fetching tutor response:", error);
    return "Desculpe, ocorreu um erro ao tentar me conectar. Por favor, tente novamente mais tarde.";
  }
};

export const generateExercise = async (subject: Subject, difficulty: string, isReview: boolean): Promise<ExerciseQuestion | null> => {
  const promptType = isReview ? 'revisão para fixação de conteúdo' : 'prática';
  const prompt = `Gere uma questão de ${promptType} de múltipla escolha de nível ${difficulty} sobre ${subject.name} para um estudante do ensino médio no Brasil. O objetivo é testar e reforçar o conhecimento. O formato da resposta deve ser um JSON. A questão deve ser desafiadora, mas justa para o nível selecionado. Forneça 4 opções de resposta (A, B, C, D). Indique qual é a opção correta e forneça uma breve explicação do porquê. Apenas uma opção pode ser correta. Não inclua a formatação de markdown ('''json) na sua resposta, apenas o JSON bruto.`;
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                            },
                            required: ['id', 'text']
                        },
                    },
                    correctOptionId: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctOptionId', 'explanation']
            }
        }
    });
    
    // FIX: The response text should be accessed via the `.text` property of the response object.
    const jsonString = response.text;

    if (!jsonString) {
      console.error("Error generating exercise: Received empty response from API.");
      return null;
    }
    
    const data = JSON.parse(jsonString.trim());

    if (data.options.length !== 4) {
        throw new Error("Generated exercise does not have 4 options.");
    }

    return data as ExerciseQuestion;
  } catch (error) {
    console.error("Error generating exercise:", error);
    return null;
  }
};