import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { themeStorage, applyTheme } from './utils/theme'
import './index.css'

// 应用保存的主题
const savedTheme = themeStorage.get();
applyTheme(savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
