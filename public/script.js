// script.js
const socket = io();
let username, language;

// Join chat function
function joinChat() {
    username = document.getElementById("username").value;
    language = document.getElementById("language").value;

    if (!username || !language) {
        alert("Please enter your name and select a language.");
        return;
    }

    // Emit the join event with user data
    socket.emit("join", { name: username, language: language });

    document.querySelector(".container").style.display = "none";
    document.getElementById("chat").style.display = "block";
}

function sendMessage() {
    const message = document.getElementById("message").value;
    if (!message) return;

    // Send message to server without translating
    socket.emit("new message", { name: username, text: message });
    document.getElementById("message").value = "";
}

// Receive messages from the server
socket.on("new message", (msg) => {
    const messageElement = document.createElement("div");

    // Check if the message is from the current client and add "self-message" class
    if (msg.name === username) {
        messageElement.classList.add("self-message");
    }

    messageElement.textContent = `${msg.name}: ${msg.text}`;
    document.getElementById("messages").appendChild(messageElement);
});

// Load chat history
socket.on("chat history", (messages) => {
    const messagesContainer = document.getElementById("messages");
    messages.forEach((msg) => {
        const messageElement = document.createElement("div");

        // Apply the message-box class to each individual message
        messageElement.classList.add("message-box");

        // Add the content of the message (name + text)
        messageElement.innerHTML = `<strong>${msg.name}:</strong> ${msg.text}`;

        // Check if the message is from the current client and add "self-message" class
        if (msg.name === username) {
            messageElement.classList.add("self-message");
        }

        // Append the message to the message container
        messagesContainer.appendChild(messageElement);
    });
    scrollToBottom();
});

// Scroll to the bottom of the message container when a new message is added
function scrollToBottom() {
    const messagesContainer = document.getElementById("messages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
