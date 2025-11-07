
import React, { useState, useEffect, useMemo } from 'react';
import type { Subject } from '../types';
import { Screen } from '../types';
import { ArrowLeftIcon, ClockIcon } from './Icons';

interface StudySessionProps {
  subject: Subject;
  onBack: () => void;
  onNavigateTo: (screen: Screen) => void;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const StudySession: React.FC<StudySessionProps> = ({ subject, onBack, onNavigateTo }) => {
    const [duration, setDuration] = useState(25 * 60); // Default 25 minutes in seconds
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            setIsFinished(true);
            new Notification('Sessão Concluída!', {
                body: `Bom trabalho! Você concluiu sua sessão de estudo de ${subject.name}.`,
                icon: '/vite.svg',
            });
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, subject.name]);

    const handleStart = () => {
        setTimeLeft(duration);
        setIsActive(true);
        setIsFinished(false);
    };

    const handleStop = () => {
        setIsActive(false);
    };

    const resetSession = () => {
        setIsActive(false);
        setIsFinished(false);
        setTimeLeft(duration);
    };

    const handleDurationChange = (minutes: number) => {
        const seconds = minutes * 60;
        setDuration(seconds);
        setTimeLeft(seconds);
    };
    
    const progress = useMemo(() => {
        if (duration === 0) return 0;
        return ((duration - timeLeft) / duration) * 100;
    }, [timeLeft, duration]);


    if (isFinished) {
        return (
            <div className="flex flex-col h-screen bg-white">
                <header className="flex items-center p-4 border-b border-gray-200">
                    <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="font-semibold text-lg ml-3 text-gray-800">Sessão Finalizada</h1>
                </header>
                <main className="flex-grow p-6 flex flex-col justify-center items-center text-center">
                    <div className="animate-pulse mb-4 text-6xl">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800">Parabéns!</h2>
                    <p className="text-gray-600 mt-2 mb-8">Você completou sua sessão de estudo de {subject.name}.</p>

                    <div className="w-full max-w-sm space-y-4">
                        <button
                            onClick={() => onNavigateTo(Screen.EXERCISE)}
                            className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors"
                        >
                            Fazer um Quiz Rápido
                        </button>
                        <button
                            onClick={() => onNavigateTo(Screen.TUTOR_CHAT)}
                            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            Revisar Conteúdo com o Tutor
                        </button>
                         <button
                            onClick={resetSession}
                            className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl hover:bg-gray-300 transition-colors"
                        >
                            Iniciar Nova Sessão
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (isActive) {
        return (
            <div className="flex flex-col h-screen bg-white">
                <header className="flex items-center p-4 border-b border-gray-200">
                     <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="font-semibold text-lg ml-3 text-gray-800">Em Foco: {subject.name}</h1>
                </header>
                <main className="flex-grow p-6 flex flex-col justify-center items-center text-center">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                            <circle
                                className="text-gray-200"
                                strokeWidth="5"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                            />
                            <circle
                                className={subject.color.replace('bg-','text-')}
                                strokeWidth="5"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={(2 * Math.PI * 45) - (progress / 100) * (2 * Math.PI * 45)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            />
                        </svg>
                        <span className="text-5xl font-bold text-gray-800 tracking-tighter">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                     <p className="text-gray-500 mt-8 mb-4">Mantenha o foco! Você consegue.</p>

                    <button
                        onClick={handleStop}
                        className="w-full max-w-xs bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors"
                    >
                        Encerrar Sessão
                    </button>
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen bg-white">
             <header className="flex items-center p-4 border-b border-gray-200">
                <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                </button>
                <div className="flex items-center">
                    <div className={'p-2 rounded-full ' + subject.color + '/20'}>
                        <ClockIcon className={`h-6 w-6 ${subject.color.replace('bg-','text-')}`} />
                    </div>
                    <h1 className="font-semibold text-lg ml-3 text-gray-800">Sessão de Estudo</h1>
                </div>
            </header>
             <main className="flex-grow p-6 flex flex-col justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Prepare-se para focar em</h2>
                    <h3 className={`text-3xl font-extrabold mt-1 ${subject.color.replace('bg-','text-')}`}>{subject.name}</h3>
                </div>

                <div className="my-10">
                    <p className="text-center font-semibold text-gray-700 mb-4">Escolha a duração:</p>
                    <div className="flex justify-center space-x-3">
                        {[15, 25, 45].map(min => (
                            <button
                                key={min}
                                onClick={() => handleDurationChange(min)}
                                className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                                    duration === min * 60
                                        ? `${subject.color} text-white`
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {min} min
                            </button>
                        ))}
                    </div>
                </div>
                
                 <div className="text-center text-5xl font-bold text-gray-800 mb-10 tracking-tighter">
                    {formatTime(timeLeft)}
                </div>

            </main>
            <footer className="p-4 bg-white border-t border-gray-200">
                <button
                    onClick={handleStart}
                    className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors"
                >
                    Iniciar Sessão
                </button>
            </footer>
        </div>
    );
};

export default StudySession;
