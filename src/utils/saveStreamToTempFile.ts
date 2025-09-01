import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { Readable } from "stream";

// Strip any paths — only take the base file name

export const saveStreamToTempFile = async (
  stream: Readable,
  filename: string
): Promise<string> => {
  const safeFilename = path.basename(filename);

  const tempDir = tmpdir(); // OS temp dir
  const timestamp = Date.now();
  const tempPath = path.join(tempDir, `${timestamp}-${safeFilename}`);
  // const tempPath = path.join(tempDir, `${timestamp}-${filename}`);

  // Ensure the directory exists
  const dir = path.dirname(tempPath);
  await fs.promises.mkdir(dir, { recursive: true });

  const writeStream = fs.createWriteStream(tempPath);

  return new Promise((resolve, reject) => {
    stream.pipe(writeStream);
    writeStream.on("finish", () => resolve(tempPath));
    writeStream.on("error", reject);
  });
};
