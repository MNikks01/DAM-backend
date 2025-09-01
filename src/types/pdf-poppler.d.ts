declare module "pdf-poppler" {
  interface ConvertOptions {
    format?: "jpeg" | "png";
    out_dir?: string;
    out_prefix?: string;
    page?: number;
    dpi?: number;
    // add more options based on usage
  }

  export function info(filePath: string, opts?: any): Promise<PdfInfo>;

  export function convert(
    filePath: string,
    options?: ConvertOptions
  ): Promise<void>;
}
