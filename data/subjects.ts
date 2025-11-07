
import type { Subject } from '../types';
import { BookIcon, CalculatorIcon, FlaskIcon, ClockIcon, GlobeIcon, TranslateIcon } from '../components/Icons';

export const subjects: Subject[] = [
  { id: 'portugues', name: 'Português', description: 'Gramática, leitura e interpretação de textos', color: 'bg-brand-red', icon: BookIcon },
  { id: 'literatura', name: 'Literatura', description: 'Análise de obras e movimentos literários', color: 'bg-brand-red', icon: BookIcon },
  { id: 'matematica', name: 'Matemática', description: 'Álgebra, geometria, estatística e funções', color: 'bg-brand-green', icon: CalculatorIcon },
  { id: 'fisica', name: 'Física', description: 'Mecânica, termologia, óptica e eletricidade', color: 'bg-brand-green', icon: CalculatorIcon },
  { id: 'quimica', name: 'Química', description: 'Estudo da matéria e suas transformações', color: 'bg-brand-teal', icon: FlaskIcon },
  { id: 'biologia', name: 'Biologia', description: 'Estudo dos seres vivos e ecossistemas', color: 'bg-brand-teal', icon: FlaskIcon },
  { id: 'historia', name: 'História', description: 'História do Brasil e mundial, da antiguidade à atualidade', color: 'bg-brand-orange', icon: ClockIcon },
  { id: 'geografia', name: 'Geografia', description: 'Geografia física, humana, política e econômica', color: 'bg-brand-lime', icon: GlobeIcon },
  { id: 'filosofia', name: 'Filosofia', description: 'Grandes pensadores e questões existenciais', color: 'bg-brand-purple', icon: BookIcon },
  { id: 'sociologia', name: 'Sociologia', description: 'Estruturas sociais e relações humanas', color: 'bg-brand-purple', icon: BookIcon },
  { id: 'ingles', name: 'Inglês', description: 'Vocabulário, gramática e conversação', color: 'bg-brand-red', icon: TranslateIcon },
  { id: 'espanhol', name: 'Espanhol', description: 'Vocabulário, gramática e conversação', color: 'bg-brand-green', icon: TranslateIcon },
  { id: 'artes', name: 'Artes', description: 'História da arte, música e expressões', color: 'bg-brand-teal', icon: BookIcon },
  { id: 'educacaofisica', name: 'Educação Física', description: 'Corpo, movimento, saúde e esportes', color: 'bg-brand-orange', icon: GlobeIcon },
];
