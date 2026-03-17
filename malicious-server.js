const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server);

// Menyimpan username dan public key pengguna
const users = new Map();

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  socket.emit("init", Array.from(users.entries()));

  socket.on("registerPublicKey", (data) => {
    const { username, publicKey } = data;
    users.set(username, publicKey);
    console.log(`${username} registered with public key.`);
    io.emit("newUser", { username, publicKey });
  });

  // Modifikasi pesan: menambahkan "(sus?)"
  socket.on("message", (data) => {
    let { username, message } = data;
    message = message + " (sus?)";
    io.emit("message", { username, message });
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Malicious server running on port ${port}`);
});