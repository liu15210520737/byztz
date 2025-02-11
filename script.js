const redisUrl = 'https://inspired-ox-13540.upstash.inspired-ox-13540';
const redisToken = 'ATTkAAIjcDFiMzcwNDZmNjZkZGE0NTA1OTRlZTgyODgxYTcyNzdlZnAxMA';

const roomCodeInput = document.getElementById('room-code');
const joinButton = document.getElementById('join-room');
const gameArea = document.getElementById('game-area');
const currentRoomDisplay = document.getElementById('current-room');
const playersList = document.getElementById('players-list');
const cardDisplay = document.getElementById('card-display');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat');
const chatLog = document.getElementById('chat-log');
const nextPlayerButton = document.getElementById('next-player');

let currentRoom = null;
let players = [];
let currentPlayerIndex = 0;

// 加入房间
joinButton.addEventListener('click', async () => {
    const roomCode = roomCodeInput.value;
    if (!roomCode) return;

    currentRoom = roomCode;
    currentRoomDisplay.textContent = currentRoom;
    gameArea.style.display = 'block';

    // 获取房间信息
    await fetchRoomData();
    startChatPolling(); // 开始轮询聊天消息
});

// 获取房间数据
async function fetchRoomData() {
    const response = await fetch(`${redisUrl}/v1/keys/${currentRoom}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${redisToken}`
        }
    });
    const data = await response.json();
    players = data.players;
    updatePlayersList(players);
    displayNextCard();
}

// 更新玩家列表
function updatePlayersList(players) {
    playersList.innerHTML = '';
    players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.textContent = player;
        playersList.appendChild(playerElement);
    });
}

// 显示下一个玩家的卡片
async function displayNextCard() {
    const currentPlayer = players[currentPlayerIndex];
    const card = await fetchCardForPlayer(currentPlayer);
    cardDisplay.textContent = `${currentPlayer} 不能: ${card}`;
    nextPlayerButton.style.display = 'block';
}

// 从 Redis 获取卡片内容
async function fetchCardForPlayer(player) {
    const response = await fetch(`${redisUrl}/v1/keys/${currentRoom}/cards/${player}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${redisToken}`
        }
    });
    const data = await response.json();
    return data.card;
}

// 发送聊天消息
sendChatButton.addEventListener('click', async () => {
    const message = chatInput.value;
    if (message) {
        await sendMessage(message);
        chatInput.value = '';
    }
});

// 发送消息到 Redis
async function sendMessage(message) {
    await fetch(`${redisUrl}/v1/keys/${currentRoom}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${redisToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    });
}

// 开始轮询聊天消息
async function startChatPolling() {
    setInterval(async () => {
        const response = await fetch(`${redisUrl}/v1/keys/${currentRoom}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${redisToken}`
            }
        });
        const data = await response.json();
        updateChatLog(data.messages);
    }, 2000); // 每2秒轮询一次
}

// 更新聊天记录
function updateChatLog(messages) {
    chatLog.innerHTML = '';
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.textContent = msg;
        chatLog.appendChild(messageElement);
    });
}

// 处理下一位玩家
nextPlayerButton.addEventListener('click', () => {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    displayNextCard();
});
