import React from 'react';
import { ToastContainer, Toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationCenter = () => {
    return (
        <ToastContainer>
            <Toast>
                <h4>Notification Title</h4>
                <p>This is a sample toast notification!</p>
            </Toast>
        </ToastContainer>
    );
};

export default NotificationCenter;