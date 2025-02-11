const redisUrl = 'YOUR_UPSTASH_REDIS_URL';
const redisToken = 'YOUR_UPSTASH_REDIS_TOKEN';

const roomCodeInput = document.getElementById('room-code');
const joinButton = document.getElementById('join-room');
const gameArea = document.getElementById('game-area');
const currentRoomDisplay = document.getElementById('current-room');
const playersList = document.getElementById('players-list');
const cardDisplay = document.getElementById('card-display');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat');

let currentRoom = null;

// 加入房间
joinButton.addEventListener('click', async () => {
    const roomCode = roomCodeInput.value;
    if (!roomCode) return;

    currentRoom = roomCode;
    currentRoomDisplay.textContent = currentRoom;
    gameArea.style.display = 'block';

    // 获取房间信息
    await fetchRoomData();
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
    updatePlayersList(data.players);
    displayRandomCard(data.cards);
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

// 显示随机卡片
function displayRandomCard(cards) {
    const randomIndex = Math.floor(Math.random() * cards.length);
    cardDisplay.textContent = cards[randomIndex];
}

// 发送聊天消息
sendChatButton.addEventListener('click', () => {
    const message = chatInput.value;
    if (message) {
        // 这里可以添加发送消息到 Redis 的逻辑
        chatInput.value = '';
    }
});
