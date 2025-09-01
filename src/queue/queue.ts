// queues/queue.ts
import { Queue } from "bullmq";
import redis from "../configs/redis";

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

// ✅ Export this so it can be imported in controllers
export async function enqueueProcessingJob(assetId: string) {
  console.log("queue should be triggered");
  await queue.add("process-video", { assetId });
}
