import IORedis, { RedisOptions } from "ioredis";

const REDIS_URL = process.env.REDIS_URL!;
if (!REDIS_URL) throw new Error("REDIS_URL is required");

const isTLS = REDIS_URL.startsWith("rediss://");

const silenceError = (err: NodeJS.ErrnoException) => {
  // Upstash serverless drops idle TCP connections — IORedis/BullMQ auto-reconnect.
  if (err.code === "ECONNRESET" || err.code === "EPIPE") return;
  console.error("❌ Redis error:", err.message);
};

/**
 * BullMQ calls .duplicate() on this connection to create internal sub-connections
 * (blocking poller, command channel, event emitter, etc.).
 * Those duplicates have NO error listeners by default → ECONNRESET prints to stderr.
 * Overriding duplicate() auto-attaches our silencer to every clone BullMQ creates.
 */
class ManagedRedis extends IORedis {
  duplicate(override?: Partial<RedisOptions>): IORedis {
    const conn = super.duplicate(override) as IORedis;
    conn.on("error", silenceError);
    return conn;
  }
}

export const redisConnection = new ManagedRedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  tls: isTLS ? {} : undefined,
  keepAlive: 5000,
  connectTimeout: 10000,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});

redisConnection.on("error", silenceError);
