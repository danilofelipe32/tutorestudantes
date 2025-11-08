

import { GoogleGenAI, Type } from "@google/genai";
import type { Subject, ExerciseQuestion } from '../types';
import { offlineExercises } from '../data/offlineExercises';

// FIX: The API key must be obtained from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: "AIzaSyA8z9gxOEp2usOFToxGQV0z7rWtiya2L9o" });

export const getTutorResponse = async (
  subject: Subject,
  messageHistory: { role: 'user' | 'model', parts: { text: string }[] }[],
  newMessage: string,
  learningGoal?: string,
  learningStyle?: string
): Promise<string> => {
  let systemInstruction = `
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
  `;

  if (learningGoal) {
    systemInstruction += `\n\nDIRETRIZ ADICIONAL - FOCO DA SESSÃO: O objetivo de aprendizado específico do aluno para esta sessão é: "${learningGoal}". Concentre sua orientação para ajudá-lo a atingir esse objetivo.`;
  }

  if (learningStyle) {
    let styleGuidance = '';
    switch (learningStyle) {
      case 'Visual':
        styleGuidance = "Use analogias visuais, descreva imagens mentais, sugira a criação de diagramas ou mapas mentais e use uma linguagem rica em descrições.";
        break;
      case 'Auditivo':
        styleGuidance = "Explique os conceitos passo a passo, como se estivesse conversando. Use repetição de ideias-chave e faça perguntas que incentivem o aluno a verbalizar seu raciocínio.";
        break;
      case 'Cinestésico':
        styleGuidance = "Conecte os conceitos a exemplos práticos e do mundo real. Sugira pequenas atividades ou experimentos mentais que o aluno possa fazer para entender o tópico.";
        break;
    }
    if (styleGuidance) {
        systemInstruction += `\n\nDIRETRIZ ADICIONAL - ESTILO DE APRENDIZADO: O estilo de aprendizado preferido do aluno é ${learningStyle}. Adapte suas explicações da seguinte forma: ${styleGuidance}`;
    }
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction.trim(),
      },
      history: messageHistory,
    });
    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Error fetching tutor response:", error);
    return "Desculpe, ocorreu um erro ao tentar me conectar. Por favor, tente novamente mais tarde.";
  }
};

export const generateExercise = async (subject: Subject, difficulty: string, isReview: boolean): Promise<ExerciseQuestion | null> => {
  if (!navigator.onLine) {
    console.log("Modo offline: tentando carregar exercício do cache.");
    const cachedQuestions = offlineExercises[subject.id];
    if (cachedQuestions && cachedQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * cachedQuestions.length);
      return cachedQuestions[randomIndex];
    }
    return null;
  }

  const questionTypes = ['multiple-choice', 'fill-in-the-blank', 'true-false'];
  const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  
  let prompt = '';
  const promptType = isReview ? 'revisão para fixação de conteúdo' : 'prática';
  const basePrompt = `Gere uma questão de ${promptType} de nível ${difficulty} sobre ${subject.name} para um estudante do ensino médio no Brasil. O objetivo é testar e reforçar o conhecimento. O formato da resposta deve ser um JSON. A questão deve ser desafiadora, mas justa para o nível selecionado. Forneça uma breve explicação do porquê a resposta correta está certa. Não inclua a formatação de markdown ('''json) na sua resposta, apenas o JSON bruto.`;

  switch (selectedType) {
    case 'true-false':
      prompt = `
        ${basePrompt}
        TIPO DE QUESTÃO: Verdadeiro ou Falso.
        INSTRUÇÕES ADICIONAIS:
        1. Crie uma afirmação no campo "question".
        2. O campo "options" deve conter exatamente duas opções: { "id": "a", "text": "Verdadeiro" } e { "id": "b", "text": "Falso" }.
        3. Defina "correctOptionId" como "a" se a afirmação for verdadeira, ou "b" se for falsa.
      `;
      break;
    case 'fill-in-the-blank':
      prompt = `
        ${basePrompt}
        TIPO DE QUESTÃO: Preencher a Lacuna.
        INSTRUÇÕES ADICIONAIS:
        1. Crie uma frase no campo "question" com uma lacuna claramente indicada por "_______".
        2. No campo "options", forneça 4 opções de resposta (A, B, C, D).
        3. Uma das opções deve ser a palavra ou frase correta para preencher a lacuna. As outras três devem ser distratores plausíveis.
        4. Defina "correctOptionId" para o ID da opção correta.
      `;
      break;
    case 'multiple-choice':
    default:
      prompt = `
        ${basePrompt}
        TIPO DE QUESTÃO: Múltipla Escolha.
        INSTRUÇÕES ADICIONAIS:
        1. Crie uma pergunta no campo "question".
        2. Forneça 4 opções de resposta (A, B, C, D) no campo "options".
        3. Apenas uma opção pode ser correta.
        4. Defina "correctOptionId" para o ID da opção correta.
      `;
      break;
  }
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt.trim(),
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
    
    const jsonString = response.text;

    if (!jsonString) {
      console.error("Error generating exercise: Received empty response from API.");
      return null;
    }
    
    const data = JSON.parse(jsonString.trim());

    if (selectedType === 'true-false' && data.options.length !== 2) {
      throw new Error("Generated true-false exercise does not have 2 options.");
    }
    
    if (selectedType !== 'true-false' && data.options.length !== 4) {
        throw new Error(`Generated ${selectedType} exercise does not have 4 options.`);
    }

    return data as ExerciseQuestion;
  } catch (error) {
    console.error("Error generating exercise:", error);
    return null;
  }
};

export const getDailyTip = async (subject: Subject): Promise<string | null> => {
  if (!navigator.onLine) {
    return "Dica offline: Revise um tópico que você já estudou hoje para fortalecer sua memória!";
  }

  const prompt = `Gere uma 'Dica do Dia' ou um fato curioso ('Você Sabia?') curto e interessante sobre ${subject.name} para um estudante do ensino médio no Brasil. A dica deve ser educativa, envolvente e ter no máximo 2 frases. Responda apenas com o texto da dica, sem títulos ou formatação extra.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const tip = response.text.trim();
    if (!tip) {
      throw new Error("API returned an empty tip.");
    }
    return tip;
  } catch (error) {
    console.error("Error generating daily tip:", error);
    return null; // Retorna nulo em caso de erro para que a UI possa lidar com isso.
  }
};
