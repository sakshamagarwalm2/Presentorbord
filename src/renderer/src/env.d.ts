
declare module 'pdfjs-dist/build/pdf.min.mjs';
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface Window {
  electron: any;
  api: {
    log: (message: string, ...args: any[]) => void;
    getLogPath: () => Promise<string>;
    openLogDir: () => Promise<void>;
  };
}
