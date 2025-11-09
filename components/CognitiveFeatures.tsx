import React from 'react';
import { ArrowLeftIcon, PuzzlePieceIcon, RefreshIcon, KnowledgeMapIcon, ChatBubbleIcon, BrainIcon, CogIcon } from './Icons';

interface CognitiveFeaturesProps {
  onBack: () => void;
  subjectColor: string;
}

const getGradientClasses = (colorClass: string) => {
    switch (colorClass) {
        case 'bg-brand-red': return 'from-brand-red to-red-500';
        case 'bg-brand-green': return 'from-brand-green to-green-500';
        case 'bg-brand-teal': return 'from-brand-teal to-teal-500';
        case 'bg-brand-orange': return 'from-brand-orange to-orange-400';
        case 'bg-brand-lime': return 'from-brand-lime to-lime-500';
        case 'bg-brand-purple': return 'from-brand-purple to-purple-500';
        default: return colorClass;
    }
};


const CognitiveFeatures: React.FC<CognitiveFeaturesProps> = ({ onBack, subjectColor }) => {
    
    const features = [
        {
            icon: PuzzlePieceIcon,
            color: 'text-green-500',
            title: 'Diagnóstico inteligente',
            description: 'O app identifica o que o aluno já sabe e personaliza o conteúdo.',
        },
        {
            icon: RefreshIcon,
            color: 'text-blue-500',
            title: 'Feedback imediato',
            description: 'Cada erro gera uma explicação do "porquê", estimulando reflexão.',
        },
        {
            icon: KnowledgeMapIcon,
            color: 'text-orange-500',
            title: 'Mapa de conhecimento',
            description: 'Mostra as conexões entre temas (como um mapa mental).',
        },
        {
            icon: ChatBubbleIcon,
            color: 'text-purple-500',
            title: 'Tutoria guiada por perguntas',
            description: 'O tutor virtual conduz o aluno com perguntas que estimulam o pensamento ("Por que isso acontece?", "Como você resolveria de outro modo?").',
        },
        {
            icon: BrainIcon,
            color: 'text-pink-500',
            title: 'Revisão espaçada e adaptativa',
            description: 'O app calcula quando o aluno deve rever um conteúdo.',
        },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className={`p-6 text-white bg-gradient-to-br ${getGradientClasses(subjectColor)} rounded-b-3xl flex-shrink-0`}>
                <div className="flex items-center mb-6 pt-4">
                    <button onClick={onBack} className="mr-4 p-2 -ml-2">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex items-center">
                    <div className="bg-white/30 p-4 rounded-full">
                        <CogIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="ml-4">
                        <h1 className="text-2xl font-bold">Recursos e funcionalidades cognitivas</h1>
                    </div>
                </div>
            </header>

            <main className="p-6 flex-grow overflow-y-auto">
                <p className="text-gray-600 mb-8 text-base">
                    Essas funções tornam o app realmente "cognitivo":
                </p>

                <ul className="space-y-6">
                    {features.map((feature, index) => (
                        <li key={feature.title} className="flex items-start animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className={`p-2 rounded-full mr-4 mt-1 ${feature.color.replace('text-', 'bg-')}/10`}>
                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{feature.title}</h3>
                                <p className="text-gray-600 mt-1">{feature.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
};

export default CognitiveFeatures;