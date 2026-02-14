import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { join } from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    fullscreen: true,
    hasShadow: false,
    ...(process.platform === 'linux' ? { icon: path.join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload:  path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Allow F12 to toggle DevTools in development
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

import { ipcMain } from 'electron'
import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'

ipcMain.handle('convert-ppt-to-pdf', async (_, pptPath: string) => {
  const pdfPath = path.join(os.tmpdir(), `${path.basename(pptPath, path.extname(pptPath))}-${Date.now()}.pdf`)
  
  const psScript = `
    $pptPath = "${pptPath}"
    $pdfPath = "${pdfPath}"
    $ppt = New-Object -ComObject PowerPoint.Application
    $presentation = $ppt.Presentations.Open($pptPath)
    $presentation.SaveAs($pdfPath, 32)
    $presentation.Close()
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
  `
  
  // Save script to a temp file to avoid quoting issues
  const scriptPath = path.join(os.tmpdir(), `convert-${Date.now()}.ps1`)
  fs.writeFileSync(scriptPath, psScript)
  
  return new Promise((resolve, reject) => {
    exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error) => {
      fs.unlinkSync(scriptPath) // Clean up script
      if (error) {
        reject(error)
      } else {
        resolve(pdfPath)
      }
    })
  })
})

// New handler: receive PPT bytes from renderer, save to temp, convert, return PDF path
ipcMain.handle('convert-ppt-buffer-to-pdf', async (_, fileBytes: number[], fileName: string) => {
  const ext = path.extname(fileName)
  const baseName = path.basename(fileName, ext)
  const tempPptPath = path.join(os.tmpdir(), `${baseName}-${Date.now()}${ext}`)
  const pdfPath = path.join(os.tmpdir(), `${baseName}-${Date.now()}.pdf`)

  // Write the PPT bytes to a temp file
  fs.writeFileSync(tempPptPath, Buffer.from(fileBytes))

  const psScript = `
    $pptPath = "${tempPptPath}"
    $pdfPath = "${pdfPath}"
    $ppt = New-Object -ComObject PowerPoint.Application
    $presentation = $ppt.Presentations.Open($pptPath)
    $presentation.SaveAs($pdfPath, 32)
    $presentation.Close()
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
  `

  const scriptPath = path.join(os.tmpdir(), `convert-${Date.now()}.ps1`)
  fs.writeFileSync(scriptPath, psScript)

  return new Promise((resolve, reject) => {
    exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error) => {
      try { fs.unlinkSync(scriptPath) } catch (_) {}
      try { fs.unlinkSync(tempPptPath) } catch (_) {}
      if (error) {
        reject(error)
      } else {
        resolve(pdfPath)
      }
    })
  })
})

ipcMain.handle('open-system-calculator', () => {
  const platform = process.platform
  let command = ''

  if (platform === 'win32') {
    command = 'calc'
  } else if (platform === 'darwin') {
    command = 'open -a Calculator'
  } else if (platform === 'linux') {
    command = 'gnome-calculator'
  }

  if (command) {
    exec(command, (error) => {
      if (error) {
        console.error('Failed to open calculator:', error)
      }
    })
  }
})

ipcMain.handle('read-pdf-file', async (_, filePath: string) => {
  const buffer = fs.readFileSync(filePath)
  // Return as a plain number array so it serializes properly over IPC
  return Array.from(new Uint8Array(buffer))
})

// Save imported files to a dedicated app data folder
ipcMain.handle('save-imported-file', async (_, fileBytes: number[], fileName: string) => {
  const appDataPath = app.getPath('userData')
  const importsDir = path.join(appDataPath, 'imported-files')
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(importsDir)) {
    fs.mkdirSync(importsDir, { recursive: true })
  }
  
  const filePath = path.join(importsDir, `${Date.now()}-${fileName}`)
  fs.writeFileSync(filePath, Buffer.from(fileBytes))
  return filePath
})

// Get the imports directory path

ipcMain.handle('get-imports-dir', async () => {
    const appDataPath = app.getPath('userData')
    const importsDir = path.join(appDataPath, 'imported-files')
    if (!fs.existsSync(importsDir)) {
      fs.mkdirSync(importsDir, { recursive: true })
    }
    return importsDir
  })
  
  // Close the app
  ipcMain.handle('close-app', () => {
    app.quit()
  })

