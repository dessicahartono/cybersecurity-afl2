const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Storage untuk username  { publicKey, socketId }
const users = new Map();
const sockets = new Map(); // 

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  // 1. Kirim semua user yang sudah terdaftar ke client baru
  socket.emit("init", Array.from(users.entries()));

  // 2. Register public key & socket
  socket.on("registerPublicKey", (data) => {
    const { username, publicKey } = data;
    
    // Validasi username unik
    if (users.has(username)) {
      socket.emit("error", { message: "Username already taken!" });
      return;
    }
    
    users.set(username, publicKey);
    sockets.set(username, socket);
    
    console.log(`${username} registered`);
    
    // Notify semua client tentang user baru
    socket.broadcast.emit("newUser", { username, publicKey });
  });

  // 3. PRIVATE MESSAGE - HANYA ke target user
  socket.on("privateMessage", (data) => {
    const { target, encryptedMessage, sender } = data;
    
    const targetSocket = sockets.get(target);
    
    if (targetSocket) {
      // Kirim KE TARGET USER SAJA dengan flag isPrivate
      targetSocket.emit("message", {
        username: sender,
        message: encryptedMessage,
        target,
        isPrivate: true
      });
      
      // Optional: konfirmasi ke sender
      socket.emit("privateSent", { target, sender });
      
      console.log(`PRIVATE: ${sender} → ${target}`);
    } else {
      socket.emit("error", { message: `${target} not online` });
      console.log(`Target ${target} not found`);
    }
  });

  // 4. PUBLIC MESSAGE - ke semua user
  socket.on("publicMessage", (data) => {
    const { username, message } = data;
    
    // Broadcast ke SEMUA user (kecuali sender)
    socket.broadcast.emit("message", {
      username,
      message,
      isPrivate: false
    });
    
    console.log(`PUBLIC: ${username}: ${message}`);
  });

  // 5. Cleanup saat disconnect
  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
    
    // Cari username yang socketnya ini
    for (let [username, clientSocket] of sockets.entries()) {
      if (clientSocket.id === socket.id) {
        sockets.delete(username);
        users.delete(username);
        
        // Notify others
        socket.broadcast.emit("userLeft", { username });
        console.log(`${username} left`);
        break;
      }
    }
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Commands:`);
  console.log(`   - !secret <user> → private chat`);
  console.log(`   - !exit → end private chat`);
  console.log(`   - !users → list users`);
});