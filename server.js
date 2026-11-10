const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initDatabase } = require('./config/db');
const setupSocketHandlers = require('./socket/tripSocket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Store io instance in Express app context
app.set('io', io);

// Setup Socket.IO Event Listeners
setupSocketHandlers(io);

// Start Database connection and HTTP server
const startServer = async () => {
  try {
    await initDatabase();

    server.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 Safe Bus Backend Server Running on Port ${PORT}`);
      console.log(`📡 Socket.IO Real-time Server Active`);
      console.log(`🌐 Base REST API: http://localhost:${PORT}/api`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to launch Safe Bus Server:', err);
    process.exit(1);
  }
};

startServer();
