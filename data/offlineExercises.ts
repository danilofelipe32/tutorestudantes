import type { ExerciseQuestion } from '../types';

export const offlineExercises: Record<string, ExerciseQuestion[]> = {
  matematica: [
    {
      question: "Qual é o valor de X na equação 2X + 5 = 15?",
      options: [
        { id: 'a', text: '10' },
        { id: 'b', text: '5' },
        { id: 'c', text: '7.5' },
        { id: 'd', text: '2.5' },
      ],
      correctOptionId: 'b',
      explanation: "Para resolver, subtraia 5 dos dois lados (2X = 10), depois divida por 2 (X = 5)."
    },
    {
      question: "Qual é a área de um triângulo com base 10cm e altura 5cm?",
      options: [
        { id: 'a', text: '50 cm²' },
        { id: 'b', text: '25 cm²' },
        { id: 'c', text: '15 cm²' },
        { id: 'd', text: '30 cm²' },
      ],
      correctOptionId: 'b',
      explanation: "A fórmula da área do triângulo é (base * altura) / 2. Portanto, (10 * 5) / 2 = 25."
    }
  ],
  portugues: [
    {
      question: "Qual figura de linguagem está presente na frase 'Aquele homem é uma raposa'?",
      options: [
        { id: 'a', text: 'Metáfora' },
        { id: 'b', text: 'Hipérbole' },
        { id: 'c', text: 'Personificação' },
        { id: 'd', text: 'Eufemismo' },
      ],
      correctOptionId: 'a',
      explanation: "É uma metáfora, pois há uma comparação implícita entre o homem e a raposa, atribuindo a ele a característica de astúcia."
    }
  ],
  historia: [
    {
      question: "Em que ano ocorreu a Proclamação da República no Brasil?",
      options: [
        { id: 'a', text: '1822' },
        { id: 'b', text: '1500' },
        { id: 'c', text: '1888' },
        { id: 'd', text: '1889' },
      ],
      correctOptionId: 'd',
      explanation: "A Proclamação da República ocorreu em 15 de novembro de 1889, pondo fim ao período imperial."
    }
  ],
};
