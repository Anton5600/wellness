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

export const scheduleMorningMood = async (timeStr: string) => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Утренний настрой',
                    body: 'Доброе утро! Не забудьте про эфирные масла для отличного дня.',
                    id: 2,
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
                    title: 'Еженедельный отчет',
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

export const scheduleStuckReminder = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 4 }] });
        
        // This is a placeholder. In a real app, you'd check the history to see if they're stuck.
        // For now, we'll just schedule it 3 days from now.
        const date = new Date();
        date.setDate(date.getDate() + 3);
        
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Поддержка',
                    body: 'Мы заметили, что вам грустно. Попробуйте использовать масло апельсина.',
                    id: 4,
                    schedule: { 
                        at: date,
                        allowWhileIdle: true
                    },
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
