import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './contexts/AppContext'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
)
