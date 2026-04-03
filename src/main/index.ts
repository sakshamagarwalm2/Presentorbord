import { app, BrowserWindow, shell, protocol, net, ipcMain } from "electron";
import path from "path";
import { join } from "path";
import { pathToFileURL } from "url";
import { logger } from "./logger";
import { exec, spawn } from "child_process";
import fs from "fs";
import os from "os";

logger.log("Application is starting...");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-asset",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
]);

function createWindow(): void {
  logger.log("Creating main window...");
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: false,
    fullscreen: true,
    hasShadow: true,
    icon: path.join(__dirname, "../../src/assets/presentor.ico"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    logger.log("Main window ready to show.");
    mainWindow.show();
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12") {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    logger.log(`External link opened: ${details.url}`);
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    logger.log(`Loading renderer from URL: ${process.env["ELECTRON_RENDERER_URL"]}`);
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    const indexPath = join(__dirname, "../renderer/index.html");
    logger.log(`Loading renderer from file: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }
}

const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel: string, listener: (...args: any[]) => any) => {
  return originalHandle(channel, async (event, ...args) => {
    logger.log(`IPC Handle: ${channel}`, ...args);
    try {
      const result = await listener(event, ...args);
      return result;
    } catch (error) {
      logger.log(`IPC Handle Error in ${channel}:`, error);
      throw error;
    }
  });
};

const originalOn = ipcMain.on.bind(ipcMain);
ipcMain.on = (channel: string, listener: (...args: any[]) => any) => {
  return originalOn(channel, (event, ...args) => {
    if (channel !== 'log-message') {
        logger.log(`IPC On: ${channel}`, ...args);
    }
    return listener(event, ...args);
  });
};

app.whenReady().then(() => {
  logger.log("App ready.");
  protocol.handle("local-asset", (request) => {
    let filePath = request.url.slice("local-asset://".length);
    filePath = decodeURIComponent(filePath);
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  logger.log("All windows closed.");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function getLibreOfficePath(): string | null {
  const platform = process.platform;
  if (platform === "win32") {
    const candidate = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
    if (fs.existsSync(candidate)) return candidate;
    const candidate86 = "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe";
    if (fs.existsSync(candidate86)) return candidate86;
  } else if (platform === "darwin") {
    const candidate = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    if (fs.existsSync(candidate)) return candidate;
  } else {
    const candidate = "/usr/bin/libreoffice";
    if (fs.existsSync(candidate)) return candidate;
    const candidateAlt = "/usr/bin/soffice";
    if (fs.existsSync(candidateAlt)) return candidateAlt;
  }
  return null;
}

function convertWithLibreOffice(inputPath: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const libreExe = getLibreOfficePath();
    if (!libreExe) {
      return reject(new Error("LibreOffice not found"));
    }

    logger.log(`[LibreOffice] Converting: ${inputPath}`);
    const child = spawn(libreExe, [
      "--headless",
      "--convert-to", "pdf",
      "--outdir", outputDir,
      inputPath,
    ]);

    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`LibreOffice exited with code ${code}: ${stderr}`));
      }
      const pdfName = path.basename(inputPath, path.extname(inputPath)) + ".pdf";
      const pdfPath = path.join(outputDir, pdfName);
      if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0) {
        logger.log(`[LibreOffice] Success: ${pdfPath}`);
        resolve(pdfPath);
      } else {
        reject(new Error("LibreOffice produced no output PDF"));
      }
    });
    child.on("error", (err) => {
      reject(new Error(`LibreOffice spawn failed: ${err.message}`));
    });
  });
}

function convertWithPowerPoint(tempPptPath: string, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const psScript = `
      $pptPath = "${tempPptPath.replace(/\\/g, "\\\\")}"
      $pdfPath = "${pdfPath.replace(/\\/g, "\\\\")}"
      try {
        $ppt = New-Object -ComObject PowerPoint.Application
        $ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoFalse
        $presentation = $ppt.Presentations.Open($pptPath, $false, $false, $false)
        $presentation.SaveAs($pdfPath, 32)
        $presentation.Close()
        $ppt.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
      } catch {
        Write-Error $_.Exception.Message
        exit 1
      }
    `;

    const scriptPath = path.join(os.tmpdir(), `convert-${Date.now()}.ps1`);
    fs.writeFileSync(scriptPath, psScript, { encoding: "utf8" });

    exec(
      `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
      (error) => {
        try { fs.unlinkSync(scriptPath); } catch (_) {}
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
}

async function convertPptToPdf(inputPath: string, pdfPath: string): Promise<string> {
  const tmpDir = os.tmpdir();

  if (process.platform === "win32") {
    try {
      logger.log("[PPTX] Attempting PowerPoint conversion...");
      await convertWithPowerPoint(inputPath, pdfPath);
      if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0) {
        logger.log("[PPTX] PowerPoint conversion succeeded");
        return pdfPath;
      }
    } catch (pptError) {
      logger.log(`[PPTX] PowerPoint failed: ${pptError}. Trying LibreOffice...`);
    }
  }

  const librePath = getLibreOfficePath();
  if (librePath) {
    try {
      logger.log("[PPTX] Attempting LibreOffice conversion...");
      return await convertWithLibreOffice(inputPath, tmpDir);
    } catch (loError) {
      logger.log(`[PPTX] LibreOffice failed: ${loError}`);
    }
  } else {
    logger.log("[PPTX] LibreOffice not found on this system");
  }

  throw new Error(
    "Could not convert PPTX. On Windows, install PowerPoint or LibreOffice. " +
    "On Mac/Linux, install LibreOffice from https://www.libreoffice.org"
  );
}

ipcMain.handle("convert-ppt-to-pdf", async (_, pptPath: string) => {
  const pdfPath = path.join(
    os.tmpdir(),
    `${path.basename(pptPath, path.extname(pptPath))}-${Date.now()}.pdf`,
  );
  return await convertPptToPdf(pptPath, pdfPath);
});

ipcMain.handle(
  "convert-ppt-buffer-to-pdf",
  async (_, fileBytes: number[], fileName: string) => {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const tempPptPath = path.join(os.tmpdir(), `${baseName}-${Date.now()}${ext}`);
    const pdfPath = path.join(os.tmpdir(), `${baseName}-${Date.now()}.pdf`);

    let tempFilesToClean: string[] = [];

    try {
      fs.writeFileSync(tempPptPath, Buffer.from(fileBytes));
      tempFilesToClean.push(tempPptPath);

      const resultPath = await convertPptToPdf(tempPptPath, pdfPath);
      tempFilesToClean.push(tempPptPath);
      return resultPath;
    } finally {
      for (const f of tempFilesToClean) {
        try { fs.unlinkSync(f); } catch (_) {}
      }
    }
  },
);

ipcMain.handle("open-system-calculator", () => {
  const platform = process.platform;
  let command = "";

  if (platform === "win32") {
    command = "calc";
  } else if (platform === "darwin") {
    command = "open -a Calculator";
  } else if (platform === "linux") {
    command = "gnome-calculator";
  }

  if (command) {
    exec(command, (error) => {
      if (error) {
        console.error("Failed to open calculator:", error);
      }
    });
  }
});

ipcMain.handle("read-pdf-file", async (_, filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  return new Uint8Array(buffer);
});

ipcMain.handle(
  "save-imported-file",
  async (_, fileBytes: Uint8Array, fileName: string) => {
    const appDataPath = app.getPath("userData");
    const importsDir = path.join(appDataPath, "imported-files");

    if (!fs.existsSync(importsDir)) {
      fs.mkdirSync(importsDir, { recursive: true });
    }

    const filePath = path.join(importsDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(filePath, Buffer.from(fileBytes));
    return filePath;
  },
);

ipcMain.handle("get-imports-dir", async () => {
  const appDataPath = app.getPath("userData");
  const importsDir = path.join(appDataPath, "imported-files");
  if (!fs.existsSync(importsDir)) {
    fs.mkdirSync(importsDir, { recursive: true });
  }
  return importsDir;
});

ipcMain.handle("minimize-app", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.handle("close-app", () => {
  app.quit();
});

ipcMain.on("console-log", (_, ...args) => {
  console.log("[Renderer UI]:", ...args);
});

ipcMain.handle(
  "save-slide-cache",
  async (_, fileBytes: number[], fileName: string) => {
    const appDataPath = app.getPath("userData");
    const cacheDir = path.join(appDataPath, "pdf-cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filePath = path.join(cacheDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(filePath, Buffer.from(fileBytes));

    return `local-asset://${filePath.replace(/\\/g, "/")}`;
  },
);
