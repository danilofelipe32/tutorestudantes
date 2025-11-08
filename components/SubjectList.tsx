import React, { useState, useEffect, useMemo } from 'react';
import type { Subject } from '../types';
import { ChevronRightIcon, BellIcon, LightBulbIcon } from './Icons';
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
    style?: React.CSSProperties;
}> = ({ subject, onClick, needsReview, stats, style }) => {
    const accuracy = stats.totalExercises > 0
        ? Math.round((stats.correctAnswers / stats.totalExercises) * 100)
        : 0;

    return (
        <button
            onClick={onClick}
            className={`w-full p-5 rounded-2xl text-white shadow-md transition-transform hover:scale-105 ${subject.color} relative overflow-hidden animate-fade-in-up`}
            style={style}
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
  const [suggestion, setSuggestion] = useState<{ subject: Subject; reason: string; cta: string } | null>(null);


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

    // Lógica de sugestão
    const subjectsWithData = subjects
      .map(subject => ({
        subject,
        data: data[subject.id],
        accuracy: data[subject.id] && data[subject.id].totalExercises > 0 
                  ? (data[subject.id].correctAnswers / data[subject.id].totalExercises) * 100 
                  : -1,
      }))
      .filter(item => item.data && item.data.totalExercises >= 5); // Considera apenas matérias com 5+ exercícios

    if (subjectsWithData.length > 0) {
      subjectsWithData.sort((a, b) => a.accuracy - b.accuracy);
      const weakestSubject = subjectsWithData[0];
      
      if (weakestSubject.accuracy < 75) {
        setSuggestion({
          subject: weakestSubject.subject,
          reason: 'Vimos que você pode melhorar aqui!',
          cta: 'Revisar ' + weakestSubject.subject.name,
        });
      } else {
        subjectsWithData.sort((a, b) => (b.data?.totalExercises ?? 0) - (a.data?.totalExercises ?? 0));
        const strongestSubject = subjectsWithData[0];
        setSuggestion({
          subject: strongestSubject.subject,
          reason: 'Você está indo muito bem!',
          cta: 'Aprofundar em ' + strongestSubject.subject.name,
        });
      }
    }

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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
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
                    {reviewSubjects.map((subject, index) => {
                        const data = learningData[subject.id];
                        const stats = {
                            totalExercises: data?.totalExercises || 0,
                            correctAnswers: data?.correctAnswers || 0,
                        };
                        return (
                          <SubjectCard 
                            key={`review-${subject.id}`}
                            subject={subject} 
                            onClick={() => onSelectSubject(subject)}
                            needsReview={true}
                            stats={stats}
                            style={{ animationDelay: `${index * 75}ms` }}
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
                {otherSubjects.map((subject, index) => {
                    const data = learningData[subject.id];
                     const stats = {
                        totalExercises: data?.totalExercises || 0,
                        correctAnswers: data?.correctAnswers || 0,
                    };
                    return (
                      <SubjectCard 
                        key={subject.id} 
                        subject={subject} 
                        onClick={() => onSelectSubject(subject)}
                        needsReview={false}
                        stats={stats}
                        style={{ animationDelay: `${(reviewSubjects.length + index) * 75}ms` }}
                      />
                    );
                })}
            </div>
        </div>
        
        {suggestion && (
          <div className="mt-8 animate-fade-in-up" style={{ animationDelay: `${(reviewSubjects.length + otherSubjects.length) * 75}ms` }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sugestão para Você</h2>
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-full mr-4">
                    <LightBulbIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{suggestion.reason}</h3>
                    <p className="text-gray-600 mt-1">
                        Que tal focar em <span className="font-semibold">{suggestion.subject.name}</span> agora?
                    </p>
                  </div>
              </div>
              <button
                  onClick={() => onSelectSubject(suggestion.subject)}
                  className="w-full mt-4 flex items-center justify-center p-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  {suggestion.cta}
                  <ChevronRightIcon className="h-5 w-5 ml-2" />
                </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubjectList;