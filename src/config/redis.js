const redis = require('redis');

// Use Redis URL if available, otherwise fall back to individual env vars
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || 6379, 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || 0, 10);
const REDIS_TLS = process.env.REDIS_TLS === 'true';

// Create Redis client (v4+ with promises)
let client;

if (REDIS_URL) {
  // Use connection URL if provided
  client = redis.createClient({
    url: REDIS_URL,
  });
} else {
  // Fall back to individual parameters
  client = redis.createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      tls: REDIS_TLS ? {} : false,
    },
    password: REDIS_PASSWORD || undefined,
    db: REDIS_DB,
  });
}

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
