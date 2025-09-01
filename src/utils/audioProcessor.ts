import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export const generateWaveForm = async (
  filePath: string,
  assetId: string
): Promise<string> => {
  const outputDir = `/tmp/${assetId}`;
  const outputPng = path.join(outputDir, "waveform.png");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const command = `audiowaveform -i "${filePath}" -o "${outputPng}" --pixels-per-second 50 --height 100 --background-color FFFFFF --waveform-color 4A90E2`;

  try {
    await execAsync(command);
    return outputPng;
  } catch (error) {
    throw new Error("Waveform generation failed: " + error);
  }
};
