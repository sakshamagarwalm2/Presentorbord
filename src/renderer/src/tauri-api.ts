import { invoke } from "@tauri-apps/api/core";

export const tauriApi = {
  log: (message: string) => {
    invoke("log_message", { message }).catch(console.error);
  },

  getLogPath: (): Promise<string> => invoke("get_log_path"),

  openLogDir: (): Promise<void> => invoke("open_log_dir"),

  saveImportedFile: (fileBytes: number[], fileName: string): Promise<string> =>
    invoke("save_imported_file", { fileBytes, fileName }),

  saveSlideCache: (fileBytes: number[], fileName: string): Promise<string> =>
    invoke("save_slide_cache", { fileBytes, fileName }),

  readPdfFile: (filePath: string): Promise<number[]> =>
    invoke("read_pdf_file", { filePath }),

  getImportsDir: (): Promise<string> => invoke("get_imports_dir"),

  minimizeApp: (): Promise<void> => invoke("minimize_app"),

  closeApp: (): Promise<void> => invoke("close_app"),

  openSystemCalculator: (): Promise<void> => invoke("open_system_calculator"),

  convertPptToPdf: (inputPath: string): Promise<string> =>
    invoke("convert_ppt_to_pdf", { inputPath }),

  openInBrowser: (url: string): Promise<void> =>
    invoke("open_in_browser", { url }),

  focusInternalBrowser: (): Promise<boolean> => invoke("focus_internal_browser"),

  getBrowserStatus: (): Promise<boolean> => invoke("get_browser_status"),

};
