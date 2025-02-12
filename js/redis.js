const REDIS_ENDPOINT = 'https://inspired-ox-13540.upstash.io';
const REDIS_TOKEN = 'ATTkAAIjcDFiMzcwNDZmNjZkZGE0NTA1OTRlZTgyODgxYTcyNzdlZnAxMA';

// 发送 Redis 命令
export async function redisCommand(command, args = []) {
  const body = {
    command: command,
    args: args
  };

  const response = await fetch(REDIS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return data;
}