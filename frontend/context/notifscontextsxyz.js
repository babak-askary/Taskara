import React, { createContext, useState, useContext } from 'react';

// Create a Context for the notification system
const NotificationContext = createContext();

// Create a provider component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (notification) => {
        setNotifications((prev) => [...prev, notification]);
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter(notification => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Create a custom hook to use the NotificationContext
export const useNotification = () => {
    return useContext(NotificationContext);
};
