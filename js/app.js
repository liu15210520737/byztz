// js/app.js
import { redisCommand } from './redis.js';

let currentRoom = null;
let currentUser = null;
let maxPlayers = 4;
let cardCount = 10;
let cardList = [];
let pollingInterval = null;

// 工具函数：若房间号为空则生成一个随机房间号
function generateRoomId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 显示房间视图，隐藏大厅视图
function showRoomView() {
  document.getElementById('lobby-view').classList.add('d-none');
  document.getElementById('room-view').classList.remove('d-none');
  document.getElementById('display-room-id').textContent = currentRoom;
  document.getElementById('display-player-name').textContent = currentUser;
}

// 将房间配置存入 Redis，键名为 room:<房间号>:config
async function createRoom(roomId, config) {
  await redisCommand('SET', [`room:${roomId}:config`, JSON.stringify(config)]);
  // 初始化玩家列表、聊天记录和牌分配信息
  await redisCommand('DEL', [`room:${roomId}:players`]);
  await redisCommand('DEL', [`room:${roomId}:chat`]);
  await redisCommand('DEL', [`room:${roomId}:cardsAssigned`]);
}

// 加入房间：将玩家名称追加到 room:<房间号>:players 列表中
async function joinRoom(roomId, playerName) {
  await redisCommand('RPUSH', [`room:${roomId}:players`, playerName]);
}

// 获取房间中的玩家列表
async function fetchPlayers(roomId) {
  const result = await redisCommand('LRANGE', [`room:${roomId}:players`, '0', '-1']);
  return result.result;
}

// 发送聊天消息，存入 room:<房间号>:chat 列表
async function sendChat(roomId, message) {
  const chatMsg = JSON.stringify({ user: currentUser, message: message, time: Date.now() });
  await redisCommand('RPUSH', [`room:${roomId}:chat`, chatMsg]);
}

// 获取聊天记录
async function fetchChat(roomId) {
  const result = await redisCommand('LRANGE', [`room:${roomId}:chat`, '0', '-1']);
  return result.result;
}

// 随机发牌：从自定义的牌组中随机为每个玩家分配一张牌
async function dealCards(roomId) {
  const players = await fetchPlayers(roomId);
  if (!players || players.length === 0) return;
  // 如果没有自定义牌内容，则生成默认牌
  if (cardList.length === 0) {
    for (let i = 1; i <= cardCount; i++) {
      cardList.push(`挑战 ${i}`);
    }
  }
  // 随机打乱牌组
  let shuffled = cardList.sort(() => 0.5 - Math.random());
  // 为每个玩家分配一张牌
  for (let i = 0; i < players.length; i++) {
    let card = shuffled[i % shuffled.length];
    await redisCommand('HSET', [`room:${roomId}:cardsAssigned`, players[i], card]);
  }
}

// 获取当前玩家的牌
async function fetchMyCard(roomId, playerName) {
  const result = await redisCommand('HGET', [`room:${roomId}:cardsAssigned`, playerName]);
  return result.result;
}

// 更新玩家列表 UI
async function updatePlayersUI() {
  const players = await fetchPlayers(currentRoom);
  const listEl = document.getElementById('players-list');
  listEl.innerHTML = '';
  if (players) {
    players.forEach(player => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.textContent = player;
      listEl.appendChild(li);
    });
  }
}

// 更新聊天 UI
async function updateChatUI() {
  const chatBox = document.getElementById('chat-box');
  const messages = await fetchChat(currentRoom);
  chatBox.innerHTML = '';
  if (messages) {
    messages.forEach(msg => {
      try {
        const chatObj = JSON.parse(msg);
        const p = document.createElement('p');
        p.innerHTML = `<strong>${chatObj.user}:</strong> ${chatObj.message}`;
        chatBox.appendChild(p);
      } catch (e) {
        console.error('解析聊天消息失败', msg);
      }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// 更新当前玩家的牌显示
async function updateMyCardUI() {
  const myCard = await fetchMyCard(currentRoom, currentUser);
  document.getElementById('my-card').textContent = myCard || '等待发牌...';
}

// 定时轮询更新房间状态（玩家列表、聊天和牌）
function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    await updatePlayersUI();
    await updateChatUI();
    await updateMyCardUI();
  }, 3000);
}

// 处理大厅表单提交：创建/加入房间
document.getElementById('room-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  let roomId = document.getElementById('room-id').value.trim();
  if (!roomId) {
    roomId = generateRoomId();
  }
  currentRoom = roomId;
  currentUser = document.getElementById('player-name').value.trim() || '匿名';
  maxPlayers = parseInt(document.getElementById('max-players').value) || 4;
  cardCount = parseInt(document.getElementById('card-count').value) || 10;
  const cardContent = document.getElementById('card-content').value.trim();
  if (cardContent) {
    cardList = cardContent.split(';').map(s => s.trim()).filter(s => s);
  }
  // 创建房间配置
  const config = {
    maxPlayers: maxPlayers,
    cardCount: cardCount,
    createdAt: Date.now()
  };
  await createRoom(roomId, config);
  await joinRoom(roomId, currentUser);
  showRoomView();
  startPolling();
});

// 处理发送聊天消息
document.getElementById('send-chat-btn').addEventListener('click', async () => {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (msg) {
    await sendChat(currentRoom, msg);
    input.value = '';
    await updateChatUI();
  }
});
document.getElementById('chat-input').addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('send-chat-btn').click();
  }
});

// 处理“随机发牌”按钮
document.getElementById('deal-cards-btn').addEventListener('click', async () => {
  await dealCards(currentRoom);
  await updateMyCardUI();
});

// 处理“报告违规”按钮，简单将报告消息作为聊天消息发送
document.getElementById('report-btn').addEventListener('click', async () => {
  const reportMsg = `${currentUser} 报告违规！`;
  await sendChat(currentRoom, reportMsg);
});