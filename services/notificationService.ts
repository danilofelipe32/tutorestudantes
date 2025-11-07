
import { getAllLearningData } from './learningService';
import { subjects } from '../data/subjects';

const NOTIFIED_SESSION_KEY = 'tutorNotifiedSubjects';
let notificationInterval: number | null = null;

// Helper para gerenciar o sessionStorage
const getNotifiedSubjects = (): string[] => {
    const notified = sessionStorage.getItem(NOTIFIED_SESSION_KEY);
    return notified ? JSON.parse(notified) : [];
};

const addNotifiedSubject = (subjectId: string) => {
    const notified = getNotifiedSubjects();
    if (!notified.includes(subjectId)) {
        notified.push(subjectId);
        sessionStorage.setItem(NOTIFIED_SESSION_KEY, JSON.stringify(notified));
    }
};

const checkAndNotifyForReviews = () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const learningData = getAllLearningData();
    const notifiedSubjects = getNotifiedSubjects();
    const now = Date.now();

    subjects.forEach(subject => {
        const data = learningData[subject.id];
        const needsReview = data && data.nextReviewDate > 0 && now >= data.nextReviewDate;

        if (needsReview && !notifiedSubjects.includes(subject.id)) {
            const notification = new Notification('Hora de Revisar!', {
                body: `Você tem uma revisão pendente em ${subject.name}. Clique para estudar!`,
                icon: '/vite.svg',
                tag: `review-${subject.id}`, // Tag para evitar notificações duplicadas
            });

            notification.onclick = () => {
                window.focus();
            };
            
            addNotifiedSubject(subject.id);
        }
    });
};

export const setupNotificationChecks = () => {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
        checkAndNotifyForReviews(); // Verifica imediatamente
        notificationInterval = window.setInterval(checkAndNotifyForReviews, 15 * 60 * 1000); // Verifica a cada 15 minutos
    }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        alert('Este navegador não suporta notificações desktop.');
        return 'denied';
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        setupNotificationChecks();
    }
    return permission;
};
