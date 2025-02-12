// js/redis.js
// 使用 Upstash REST API 形式封装 Redis 命令调用
// 请将下面的 REDIS_REST_URL 与 REDIS_TOKEN 替换为你在 Upstash 控制台中获取的 REST API 端点与令牌

const REDIS_REST_URL = 'https://inspired-ox-13540.upstash.io';
const REDIS_TOKEN = 'ATTkAAIjcDFiMzcwNDZmNjZkZGE0NTA1OTRlZTgyODgxYTcyNzdlZnAxMA';

/**
 * 通用请求函数
 * @param {string} endpoint 请求的 URL 路径（包含命令及参数，已进行 URI 编码）
 * @param {string} method HTTP 方法，默认 GET
 * @param {object|null} body 请求体（如有需要，可传 JSON 对象）
 * @returns {Promise<object>} 返回 JSON 格式的响应
 */
async function redisRequest(endpoint, method = 'GET', body = null) {
  const url = `${REDIS_REST_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  return await response.json();
}

/**
 * 设置键值（对应 Redis 的 SET 命令）
 * 用法示例：redisSet('foo', 'bar') 会请求 /set/foo/bar
 */
export async function redisSet(key, value, ...args) {
  // 如果有额外参数（如 EX 过期时间），依次拼接到 URL 后面
  let endpoint = `/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
  if (args.length > 0) {
    endpoint += '/' + args.map(arg => encodeURIComponent(arg)).join('/');
  }
  // SET 命令修改数据，建议使用 POST 请求
  return redisRequest(endpoint, 'POST');
}

/**
 * 获取键值（对应 Redis 的 GET 命令）
 * 用法示例：redisGet('foo') 会请求 /get/foo
 */
export async function redisGet(key) {
  const endpoint = `/get/${encodeURIComponent(key)}`;
  return redisRequest(endpoint, 'GET');
}

/**
 * 删除键（对应 Redis 的 DEL 命令）
 * 用法示例：redisDel('foo') 会请求 /del/foo
 */
export async function redisDel(key) {
  const endpoint = `/del/${encodeURIComponent(key)}`;
  return redisRequest(endpoint, 'POST');
}

/**
 * 列表尾部追加元素（对应 Redis 的 RPUSH 命令）
 * 用法示例：redisRPush('room:123:players', 'Alice') 会请求 /rpush/room%3A123%3Aplayers/Alice
 */
export async function redisRPush(key, ...values) {
  let endpoint = `/rpush/${encodeURIComponent(key)}`;
  for (const value of values) {
    endpoint += '/' + encodeURIComponent(value);
  }
  return redisRequest(endpoint, 'POST');
}

/**
 * 获取列表区间内的元素（对应 Redis 的 LRANGE 命令）
 * 用法示例：redisLRange('room:123:players', 0, -1) 会请求 /lrange/room%3A123%3Aplayers/0/-1
 */
export async function redisLRange(key, start, stop) {
  const endpoint = `/lrange/${encodeURIComponent(key)}/${encodeURIComponent(start)}/${encodeURIComponent(stop)}`;
  return redisRequest(endpoint, 'GET');
}

/**
 * 哈希表设置字段值（对应 Redis 的 HSET 命令）
 * 用法示例：redisHSet('room:123:cardsAssigned', 'Alice', '不许笑') 会请求 /hset/room%3A123%3AcardsAssigned/Alice/%E4%B8%8D%E8%A6%81%E7%AC%91
 */
export async function redisHSet(key, field, value) {
  const endpoint = `/hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}/${encodeURIComponent(value)}`;
  return redisRequest(endpoint, 'POST');
}

/**
 * 哈希表获取字段值（对应 Redis 的 HGET 命令）
 * 用法示例：redisHGet('room:123:cardsAssigned', 'Alice') 会请求 /hget/room%3A123%3AcardsAssigned/Alice
 */
export async function redisHGet(key, field) {
  const endpoint = `/hget/${encodeURIComponent(key)}/${encodeURIComponent(field)}`;
  return redisRequest(endpoint, 'GET');
}