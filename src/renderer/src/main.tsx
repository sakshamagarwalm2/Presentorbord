import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { tauriApi } from './tauri-api'

// Initial startup log
tauriApi.log("Renderer process started.")

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
