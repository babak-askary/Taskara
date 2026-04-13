// Notification Service
class NotificationService {
    constructor() {
        this.notifications = [];
    }

    addNotification(notification) {
        this.notifications.push(notification);
    }

    getNotifications() {
        return this.notifications;
    }
}

module.exports = new NotificationService();