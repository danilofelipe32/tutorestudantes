import type { Subject } from '../types';
import { 
  PenNibIcon, 
  BookOpenIcon, 
  CalculatorIcon, 
  AtomIcon, 
  BeakerIcon, 
  DnaIcon, 
  HourglassIcon, 
  GlobeAltIcon, 
  BrainIcon, 
  UsersIcon, 
  TranslateIcon, 
  PaintBrushIcon, 
  DumbbellIcon 
} from '../components/Icons';

export const subjects: Subject[] = [
  { id: 'portugues', name: 'Português', description: 'Gramática, leitura e interpretação de textos', color: 'bg-brand-red', icon: PenNibIcon },
  { id: 'literatura', name: 'Literatura', description: 'Análise de obras e movimentos literários', color: 'bg-brand-red', icon: BookOpenIcon },
  { id: 'matematica', name: 'Matemática', description: 'Álgebra, geometria, estatística e funções', color: 'bg-brand-green', icon: CalculatorIcon },
  { id: 'fisica', name: 'Física', description: 'Mecânica, termologia, óptica e eletricidade', color: 'bg-brand-green', icon: AtomIcon },
  { id: 'quimica', name: 'Química', description: 'Estudo da matéria e suas transformações', color: 'bg-brand-teal', icon: BeakerIcon },
  { id: 'biologia', name: 'Biologia', description: 'Estudo dos seres vivos e ecossistemas', color: 'bg-brand-teal', icon: DnaIcon },
  { id: 'historia', name: 'História', description: 'História do Brasil e mundial', color: 'bg-brand-orange', icon: HourglassIcon },
  { id: 'geografia', name: 'Geografia', description: 'Geografia física, humana e política', color: 'bg-brand-lime', icon: GlobeAltIcon },
  { id: 'filosofia', name: 'Filosofia', description: 'Grandes pensadores e questões', color: 'bg-brand-purple', icon: BrainIcon },
  { id: 'sociologia', name: 'Sociologia', description: 'Estruturas sociais e relações humanas', color: 'bg-brand-purple', icon: UsersIcon },
  { id: 'ingles', name: 'Inglês', description: 'Vocabulário, gramática e conversação', color: 'bg-brand-red', icon: TranslateIcon },
  { id: 'espanhol', name: 'Espanhol', description: 'Vocabulário, gramática e conversação', color: 'bg-brand-green', icon: TranslateIcon },
  { id: 'artes', name: 'Artes', description: 'História da arte, música e expressões', color: 'bg-brand-teal', icon: PaintBrushIcon },
  { id: 'educacaofisica', name: 'Educação Física', description: 'Corpo, movimento, saúde e esportes', color: 'bg-brand-orange', icon: DumbbellIcon },
];
