import { Queue } from "bullmq";
import redis from "../configs/redis.js";

export const queue = new Queue("storage-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
