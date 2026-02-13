import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { join } from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: path.join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload:  path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
  return fs.readFileSync(filePath)
})
