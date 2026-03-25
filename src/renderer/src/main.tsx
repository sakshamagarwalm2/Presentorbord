import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initial startup log
window.api.log("Renderer process started.");

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
