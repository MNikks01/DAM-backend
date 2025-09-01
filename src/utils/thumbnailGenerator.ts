import fs from "fs";
import poppler from "pdf-poppler";
import Ffmpeg from "fluent-ffmpeg";
import path from "path";
import { exec } from "child_process";
import puppeteer from "puppeteer";
import type { ConvertOptions } from "pdf-poppler";

export const generateVideoThumbnail = (
  videoPath: string,
  outputDir: string,
  filename: string
): Promise<string> => {
  const thumbnailPath = path.join(outputDir, `${filename}-thumbnail.jpg`);

  return new Promise((resolve, reject) => {
    Ffmpeg(videoPath)
      .screenshots({
        count: 1,
        timemarks: ["5%"], // take thumbnail at 5% duration
        filename: path.basename(thumbnailPath),
        folder: outputDir,
        size: "320x?",
      })
      .on("end", () => resolve(thumbnailPath))
      .on("error", reject);
  });
};

export const getDefaultThumbnailForType = (category: string): string => {
  return `defaults/${category}-icon.jpg`; // Stored locally or in bucket
};

export const generateTextThumbnail = async (
  textPath: string,
  outputDir: string,
  filename: string
): Promise<string> => {
  // Read first 1000 characters from text file
  const rawText = fs.readFileSync(textPath, "utf-8").slice(0, 1000);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Output path with .jpeg extension (cast to template literal type)
  const outputPath = path.join(
    outputDir,
    `${filename}-thumb.jpeg`
  ) as `${string}.jpeg`;

  // Launch Puppeteer (ensure compatibility with Docker if needed)
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set content to render
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: monospace;
          }
          pre {
            margin: 0;
            padding: 16px;
            font-size: 14px;
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <pre>${rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      </body>
    </html>
  `);

  // Capture screenshot
  await page.screenshot({
    path: outputPath,
    type: "jpeg",
    quality: 80,
    fullPage: false,
  });

  await browser.close();

  return outputPath;
};

// Convert DOCX to PDF
export const convertOfficeToPdf = (filePath: string): Promise<string> => {
  const outputDir = path.dirname(filePath);
  return new Promise((resolve, reject) => {
    exec(
      `libreoffice --headless --convert-to pdf "${filePath}" --outdir "${outputDir}"`,
      (error, stdout, stderr) => {
        if (error) return reject(error);
        const pdfPath = filePath.replace(/\.\w+$/, ".pdf");
        if (fs.existsSync(pdfPath)) resolve(pdfPath);
        else reject(new Error("PDF not created"));
      }
    );
  });
};

// Generate PDF thumbnail from converted PDF
export const generatePdfThumbnail = async (
  pdfPath: string,
  outputDir: string,
  filename: string
): Promise<string> => {
  const outputFile = path.join(outputDir, `${filename}-thumbnail`);
  const opts = {
    format: "jpeg" as "jpeg",
    out_dir: outputDir,
    out_prefix: `${filename}-thumbnail`,
    page: 1,
  };
  await poppler.convert(pdfPath, opts);
  return `${outputFile}-1.jpg`;
};

// Full flow for DOCX thumbnails
export async function generateDocxThumbnail(
  docxPath: string,
  outputDir: string,
  filename: string
): Promise<string> {
  const pdfPath = await convertOfficeToPdf(docxPath);
  const thumbnail = await generatePdfThumbnail(pdfPath, outputDir, filename);
  return thumbnail;
}
