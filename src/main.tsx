import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './contexts/AppContext'
import { TooltipProvider } from './components/ui/tooltip'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </AppProvider>
  </StrictMode>,
)
