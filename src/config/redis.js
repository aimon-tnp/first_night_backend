const redis = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = process.env.REDIS_DB || 0;
const REDIS_TLS = process.env.REDIS_TLS === 'true';

// Create Redis client (v4+ with promises)
const client = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    tls: REDIS_TLS,
  },
  password: REDIS_PASSWORD || undefined,
  db: REDIS_DB,
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('✓ Redis connected');
});

client.on('ready', () => {
  console.log('✓ Redis ready');
});

client.on('end', () => {
  console.log('Redis connection closed');
});

// Connect to Redis
client.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});

module.exports = client;
