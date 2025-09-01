import { Worker } from "bullmq";
import redis from "../configs/redis.js";
import { processAsset } from "../services/assetProcessor.js";

const worker = new Worker(
  "storage-processing",
  async (job) => {
    console.log(`Processing job ${job.id} : ${job.data.originalName}`);
    await processAsset(job.data);
  },
  { connection: redis, concurrency: 3 }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error : ${err.message}`);
});

console.log("Asset worker started");

if (require.main === module) {
  console.log("Worker process started");
}

export default worker;
