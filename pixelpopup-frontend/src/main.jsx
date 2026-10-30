import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './ui/theme/siteTheme.css'
import { SiteThemeProvider } from './ui/theme/SiteTheme.jsx'
import App from './App.jsx'
import RetroStage from './ui/retro/Stage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteThemeProvider><App /></SiteThemeProvider>
  </StrictMode>,
)
