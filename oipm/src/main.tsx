import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import App from './App.tsx'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="xinao-ui-theme">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)