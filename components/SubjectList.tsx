
import React, { useState, useEffect } from 'react';
import type { Subject } from '../types';
import { BookIcon, CalculatorIcon, FlaskIcon, ClockIcon, GlobeIcon, TranslateIcon, ChevronRightIcon, BellIcon } from './Icons';
import { getAllLearningData, SubjectLearningData } from '../services/learningService';
import { subjects } from '../data/subjects';
import { requestNotificationPermission } from '../services/notificationService';

interface SubjectListProps {
  onSelectSubject: (subject: Subject) => void;
}

const SubjectCard: React.FC<{
    subject: Subject;
    onClick: () => void;
    needsReview: boolean;
    stats: { totalExercises: number; correctAnswers: number };
}> = ({ subject, onClick, needsReview, stats }) => {
    const accuracy = stats.totalExercises > 0
        ? Math.round((stats.correctAnswers / stats.totalExercises) * 100)
        : 0;

    return (
        <button
            onClick={onClick}
            className={`w-full p-5 rounded-2xl text-white shadow-md transition-transform hover:scale-105 ${subject.color} relative overflow-hidden`}
        >
            {needsReview && (
                <div className="absolute top-2 right-2 flex items-center bg-white/25 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <BellIcon className="h-4 w-4 mr-1"/>
                    Revisar
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-white/30 p-3 rounded-full">
                        <subject.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="font-bold text-lg">{subject.name}</h3>
                        <p className="text-sm opacity-90">{subject.description}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-white/70" />
            </div>
            
            {stats.totalExercises > 0 && (
                <>
                    <div className="border-t border-white/30 my-3"></div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>
                            {stats.totalExercises} {stats.totalExercises === 1 ? 'exercício' : 'exercícios'}
                        </span>
                        <span>{accuracy}% de acerto</span>
                    </div>
                </>
            )}
        </button>
    );
};


const SubjectList: React.FC<SubjectListProps> = ({ onSelectSubject }) => {
  const [learningData, setLearningData] = useState<Record<string, SubjectLearningData>>({});
  const [reviewSubjects, setReviewSubjects] = useState<Subject[]>([]);
  const [otherSubjects, setOtherSubjects] = useState<Subject[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');


  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const data = getAllLearningData();
    setLearningData(data);

    const toReview: Subject[] = [];
    const others: Subject[] = [];
    const now = Date.now();

    subjects.forEach(subject => {
        const subjectData = data[subject.id];
        const needsReview = subjectData ? (subjectData.nextReviewDate > 0 && now >= subjectData.nextReviewDate) : false;
        if (needsReview) {
            toReview.push(subject);
        } else {
            others.push(subject);
        }
    });

    setReviewSubjects(toReview);
    setOtherSubjects(others);
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
  };

  const getNotificationButton = () => {
    if (!('Notification' in window)) return null;

    let title, iconColor, onClick, disabled;
    switch (permission) {
        case 'granted':
            title = 'Notificações de revisão ativadas';
            iconColor = 'text-green-500';
            onClick = () => {};
            disabled = true;
            break;
        case 'denied':
            title = 'Notificações bloqueadas pelo navegador';
            iconColor = 'text-gray-400';
            onClick = () => {};
            disabled = true;
            break;
        default:
            title = 'Ativar notificações de revisão';
            iconColor = 'text-gray-500 hover:text-gray-700';
            onClick = handleRequestPermission;
            disabled = false;
    }

    return (
        <button
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors ${!disabled ? 'hover:bg-gray-200' : 'cursor-default'}`}
            aria-label={title}
        >
            <BellIcon className={`h-6 w-6 ${iconColor}`} />
        </button>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="pt-8 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800">
              Olá, Estudante! <span role="img" aria-label="waving hand">👋</span>
            </h1>
            <p className="text-gray-500 mt-2">Escolha uma matéria para começar a estudar</p>
          </div>
          {getNotificationButton()}
        </div>
      </header>
      <main className="flex-grow overflow-y-auto pb-4">
        {reviewSubjects.length > 0 && (
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Para Revisar Hoje</h2>
                <div className="space-y-4">
                    {reviewSubjects.map((subject) => {
                        const data = learningData[subject.id] || {};
                        const stats = {
                            totalExercises: data.totalExercises || 0,
                            correctAnswers: data.correctAnswers || 0,
                        };
                        return (
                          <SubjectCard 
                            key={`review-${subject.id}`}
                            subject={subject} 
                            onClick={() => onSelectSubject(subject)}
                            needsReview={true}
                            stats={stats}
                          />
                        );
                    })}
                </div>
            </div>
        )}

        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {reviewSubjects.length > 0 ? "Todas as Matérias" : "Matérias"}
            </h2>
            <div className="space-y-4">
                {otherSubjects.map((subject) => {
                    const data = learningData[subject.id] || {};
                     const stats = {
                        totalExercises: data.totalExercises || 0,
                        correctAnswers: data.correctAnswers || 0,
                    };
                    return (
                      <SubjectCard 
                        key={subject.id} 
                        subject={subject} 
                        onClick={() => onSelectSubject(subject)}
                        needsReview={false}
                        stats={stats}
                      />
                    );
                })}
            </div>
        </div>
      </main>
    </div>
  );
};

export default SubjectList;
