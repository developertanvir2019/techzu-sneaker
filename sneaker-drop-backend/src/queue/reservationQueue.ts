import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const reservationQueue = new Queue("reservation-expiry", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200,     // Keep last 200 failed jobs
  },
});

export const scheduleReservationExpiry = async (
  reservationId: string,
  delayMs: number = 60000
) => {
  await reservationQueue.add(
    "expire-reservation",
    { reservationId },
    {
      delay: delayMs,
      jobId: `expire-${reservationId}`, // Idempotent - prevents duplicates
    }
  );
  console.log(
    `⏱️  Scheduled expiry for reservation ${reservationId} in ${delayMs}ms`
  );
};
