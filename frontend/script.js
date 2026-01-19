let socket = null;
let username = "";

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const statusBadge = document.getElementById('status');
const messagesContainer = document.getElementById('messages-container');
const usernameInput = document.getElementById('username-input');
const messageInput = document.getElementById('message-input');
const joinBtn = document.getElementById('join-btn');
const sendBtn = document.getElementById('send-btn');

function appendMessage(data) {
    const msgDiv = document.createElement('div');

    if (data.type === 'system') {
        msgDiv.className = 'message system';
        msgDiv.innerText = data.content;
    } else {
        const isOwn = data.user === username;
        msgDiv.className = `message ${isOwn ? 'own' : 'other'}`;

        const senderSpan = document.createElement('span');
        senderSpan.className = 'sender';
        senderSpan.innerText = isOwn ? 'You' : data.user;

        const contentDiv = document.createElement('div');
        contentDiv.innerText = data.content;

        msgDiv.appendChild(senderSpan);
        msgDiv.appendChild(contentDiv);
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function connect() {
    username = usernameInput.value.trim();
    if (!username) return alert("Please enter a username");

    // Connect to WebSocket server
    // Note: In production (EC2), replace 127.0.0.1 with your EC2 Public IP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Default to localhost:8000 if we're opening the file locally or from a file:/// URL
    let host = window.location.host;
    if (!host || host === '127.0.0.1' || host === 'localhost') {
        host = '127.0.0.1:8000';
    }

    socket = new WebSocket(`${protocol}//${host}/ws/${username}`);

    socket.onopen = () => {
        statusBadge.innerText = "Online";
        statusBadge.className = "status online";
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        appendMessage(data);
    };

    socket.onclose = () => {
        statusBadge.innerText = "Offline";
        statusBadge.className = "status offline";
        // Optionally redirect back to login
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        alert("Failed to connect to the server. Make sure the backend is running on port 8000.");
    };
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (content && socket) {
        socket.send(JSON.stringify({ content }));
        messageInput.value = "";
    }
}

joinBtn.addEventListener('click', connect);
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') connect();
});
