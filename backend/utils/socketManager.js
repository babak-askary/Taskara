const { Server } = require('socket.io');

class SocketManager {
    constructor(server) {
        this.io = new Server(server);
        this.configureSocket();
    }

    configureSocket() {
        this.io.on('connection', (socket) => {
            console.log('New WebSocket connection established.');

            // Example event listener for user notifications
            socket.on('sendNotification', (data) => {
                const { message } = data;
                this.io.emit('notification', { message });
            });

            socket.on('disconnect', () => {
                console.log('WebSocket connection closed.');
            });
        });
    }
}

module.exports = SocketManager;