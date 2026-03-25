import { app, ipcMain, shell } from "electron";
import fs from "fs";
import path from "path";
import os from "os";

class Logger {
  private logFilePath: string;
  private logDir: string;

  constructor() {
    const appDataPath = app.getPath("userData");
    this.logDir = path.join(appDataPath, "logs");

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logFilePath = path.join(this.logDir, `app-log-${timestamp}.txt`);

    this.log(`--- Log started at ${new Date().toISOString()} ---`);
    this.log(`System: ${os.type()} ${os.release()} (${os.arch()})`);
    this.log(`App Version: ${app.getVersion()}`);
    this.log(`Log File: ${this.logFilePath}`);
  }

  public log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg
    );
    const logMessage = `[${timestamp}] [MAIN] ${message} ${formattedArgs.join(" ")}\n`;

    // Write to file
    fs.appendFileSync(this.logFilePath, logMessage);

    // Also output to console for development
    console.log(logMessage.trim());
  }

  public logRenderer(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg
    );
    const logMessage = `[${timestamp}] [RENDERER] ${message} ${formattedArgs.join(" ")}\n`;

    // Write to file
    fs.appendFileSync(this.logFilePath, logMessage);

    // Also output to console
    console.log(logMessage.trim());
  }

  public getLogPath() {
    return this.logFilePath;
  }

  public openLogDir() {
    shell.openPath(this.logDir);
  }
}

// Global logger instance
export const logger = new Logger();

// Listen for logs from renderer
ipcMain.on("log-message", (_, message, ...args) => {
  logger.logRenderer(message, ...args);
});

// Provide log path to renderer
ipcMain.handle("get-log-path", () => {
  return logger.getLogPath();
});

// Open log directory
ipcMain.handle("open-log-dir", () => {
  logger.openLogDir();
});
