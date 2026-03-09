declare module "pdfkit" {
  class PDFDocument {
    constructor(options?: any);
    pipe(stream: any): this;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(color?: string): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color: string): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    end(): void;
    on(event: string, listener: (...args: any[]) => void): this;
    y: number;
    page: { width: number; height: number };
  }
  export default PDFDocument;
}
