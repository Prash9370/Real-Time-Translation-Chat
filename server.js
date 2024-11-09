// server.js
const express = require("express");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const fetch = require("node-fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Middleware to serve static files
app.use(express.static("public"));

// Load messages from JSON file
const loadMessages = () => {
  const data = fs.readFileSync("messages.json");
  return JSON.parse(data).messages;
};

// Save messages to JSON file
const saveMessages = (messages) => {
  fs.writeFileSync("messages.json", JSON.stringify({ messages }, null, 2));
};

// Translate text using the free-google-translator API
async function translateText(text, targetLang) {
  const url = `https://free-google-translator.p.rapidapi.com/external-api/free-google-translator?from=en&to=${targetLang}&query=${encodeURIComponent(text)}`;
  
  const options = {
    method: 'POST',
    headers: {
      'x-rapidapi-key': '80ee3f5699msh306198683c3540fp15c746jsna3a0da0b8e80', // Replace with your actual API key
      'x-rapidapi-host': 'free-google-translator.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ translate: 'rapidapi' })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return result.translation || text;  // Use the translated text or fallback to original text
  } catch (error) {
    console.error("Translation API error:", error);
    return text;  // Fallback to original text in case of error
  }
}

// On connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Load and send all messages to the newly connected client
  const messages = loadMessages();

  // Store the user's language preference when they join
  socket.on("join", (userData) => {
    socket.username = userData.name;
    socket.language = userData.language;

    // Send the translated chat history to the new client
    const translatedMessages = messages.map(async (msg) => {
      const translatedText = await translateText(msg.text, socket.language);
      return { name: msg.name, text: translatedText };
    });

    Promise.all(translatedMessages).then((history) => {
      socket.emit("chat history", history);
    });
  });

  // When a client sends a new message
  socket.on("new message", async (msgData) => {
    const { name, text } = msgData;
    const newMessage = { name, text };

    // Save the new message to the JSON file
    messages.push(newMessage);
    saveMessages(messages);

    // Broadcast the message to each client with translation based on each client's language
    for (let [id, clientSocket] of io.sockets.sockets) {
      const userLanguage = clientSocket.language;
      const translatedText = await translateText(text, userLanguage);
      clientSocket.emit("new message", { name, text: translatedText });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
