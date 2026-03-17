const io = require("socket.io-client");
const readline = require("readline");
const crypto = require("crypto");

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

let username = "";
let registeredUsername = "";
let targetUsername = "";
const users = new Map();

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

function encryptMessage(message, targetPublicKey) {
  return crypto.publicEncrypt(targetPublicKey, Buffer.from(message, "utf8")).toString("base64");
}

function decryptMessage(encryptedMessage) {
  return crypto.privateDecrypt(privateKey, Buffer.from(encryptedMessage, "base64")).toString("utf8");
}

socket.on("connect", () => {
  console.log("Connected to server");
  
  rl.question("Enter your username: ", (input) => {
    username = input;
    registeredUsername = input;
    console.log(`\n Welcome, ${username}!`);

    // Register public key to server
    socket.emit("registerPublicKey", { username, publicKey });
    rl.prompt();
  });
});

socket.on("init", (keys) => {
  keys.forEach(([user, key]) => users.set(user, key));
  console.log(`\n ${users.size} users online`);
  console.log("Commands: !secret <user>, !exit, !users");
  rl.prompt();
});

socket.on("newUser", ({ username: newUser, publicKey }) => {
  users.set(newUser, publicKey);
  console.log(`\n ${newUser} joined`);
  rl.prompt();
});

socket.on("message", (data) => {
  const { username: sender, message: encryptedMsg, target, isPrivate } = data;
  
  if (sender !== username) {
    let displayMsg;
    let prefix = "";
    
    try {
      // Hanya target user yang bisa decrypt private message
      if (isPrivate && target === username) {
        displayMsg = decryptMessage(encryptedMsg);
        prefix = " PRIVATE ";
      } else if (!isPrivate) {
        // Public message - no decryption needed
        displayMsg = encryptedMsg;
        prefix = " ";
      } else {
        // Bukan target → tampilkan gibberish (ciphertext)
        displayMsg = encryptedMsg;
        prefix = "[ENCRYPTED FOR OTHERS] ";
      }
    } catch (err) {
      displayMsg = encryptedMsg;
      prefix = " ";
    }
    
    console.log(`\n${prefix}${sender}: ${displayMsg}`);
  }
  rl.prompt();
});

rl.on("line", (message) => {
  if (!message.trim()) return rl.prompt();

  // Commands
  if (message.match(/^!users$/)) {
    console.log("\n Online users:");
    Array.from(users.keys()).forEach(user => {
      const status = user === targetUsername ? " (SECRET)" : "";
      console.log(`  • ${user}${status}`);
    });
    console.log("");
  } 
  else if ((match = message.match(/^!secret (\w+)$/))) {
    targetUsername = match[1];
    if (users.has(targetUsername)) {
      console.log(`\n Secret chat with ${targetUsername} activated`);
    } else {
      console.log(`\n ${targetUsername} not found`);
      targetUsername = "";
    }
  } 
  else if (message.match(/^!exit$/)) {
    console.log(`\n👋 Secret chat ended`);
    targetUsername = "";
  } 
  // Send message
  else {
    if (targetUsername && users.has(targetUsername)) {
      //ENCRYPT untuk target user SAJA
      const targetPublicKey = users.get(targetUsername);
      const encrypted = encryptMessage(message, targetPublicKey);
      
      socket.emit("privateMessage", {
        target: targetUsername,
        encryptedMessage: encrypted,
        sender: username
      });
      console.log(`\n Sent encrypted to ${targetUsername}`);
    } else {
      // Public message
      socket.emit("publicMessage", { username, message });
      console.log(`\n Sent public: ${message}`);
    }
  }
  rl.prompt();
});

socket.on("disconnect", () => {
  console.log("\n Disconnected");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n Bye!");
  process.exit(0);
});