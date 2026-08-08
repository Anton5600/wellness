import { LocalNotifications } from '@capacitor/local-notifications';

export const requestPermissions = async () => {
    try {
        const { display } = await LocalNotifications.requestPermissions();
        return display === 'granted';
    } catch (error) {
        console.error('Error requesting notification permissions', error);
        return false;
    }
};

export const scheduleDailyReminder = async (timeStr: string) => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Ежедневный квиз',
                    body: 'Как вы себя чувствуете сегодня?',
                    id: 1,
                    schedule: { 
                        on: { 
                            hour: hours, 
                            minute: minutes 
                        },
                        allowWhileIdle: true
                    },
                }
            ]
        });
    } catch (error) {
        console.error('Error scheduling daily reminder', error);
    }
};

export const cancelDailyReminder = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    } catch (error) {
        console.error('Error canceling daily reminder', error);
    }
};

export const scheduleMorningMood = async (timeStr: string, customBody?: string) => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: '☀️ Утренний настрой',
                    body: customBody || '☀️ Ваш персональный арома-настрой готов! Откройте приложение для 1-мин арома-ингаляции.',
                    id: 2,
                    schedule: { 
                        on: { 
                            hour: hours, 
                            minute: minutes 
                        },
                        allowWhileIdle: true
                    },
                    extra: { target: 'aroma' }
                }
            ]
        });
    } catch (error) {
        console.error('Error scheduling morning mood', error);
    }
};

export const cancelMorningMood = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
    } catch (error) {
        console.error('Error canceling morning mood', error);
    }
};

export const scheduleWeeklyReport = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 3 }] });
        
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: '📊 Еженедельный отчет',
                    body: 'Ваша эмоциональная статистика за неделю готова!',
                    id: 3,
                    schedule: { 
                        on: { 
                            weekday: 1, // Sunday
                            hour: 10, 
                            minute: 0 
                        },
                        allowWhileIdle: true
                    },
                }
            ]
        });
    } catch (error) {
        console.error('Error scheduling weekly report', error);
    }
};

export const cancelWeeklyReport = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 3 }] });
    } catch (error) {
        console.error('Error canceling weekly report', error);
    }
};

export const scheduleStuckReminder = async (customBody?: string) => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 4 }] });
        
        const date = new Date();
        date.setDate(date.getDate() + 1); // 1 day interval for check
        
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: '🌿 Бережная арома-поддержка',
                    body: customBody || 'Мы с вами. Эфирные масла помогли многим вернуть внутренний покой. Откройте ваш настрой.',
                    id: 4,
                    schedule: { 
                        at: date,
                        allowWhileIdle: true
                    },
                    extra: { target: 'aroma' }
                }
            ]
        });
    } catch (error) {
        console.error('Error scheduling stuck reminder', error);
    }
};

export const cancelStuckReminder = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 4 }] });
    } catch (error) {
        console.error('Error canceling stuck reminder', error);
    }
};

export const initNotificationListeners = (onNavigateToAromaWidget: () => void) => {
    try {
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            if (action.notification?.extra?.target === 'aroma' || action.notification?.id === 2 || action.notification?.id === 4) {
                onNavigateToAromaWidget();
            }
        });
    } catch (e) {
        console.warn('LocalNotifications listeners not initialized:', e);
    }
};

