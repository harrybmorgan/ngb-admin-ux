import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@wexinc-healthbenefits/ben-ui-kit'
import { Toaster } from 'sonner'
import '@wex/design-tokens'
import './index.css'
import App from './App.tsx'

function routerBasename(): string | undefined {
  const raw = import.meta.env.BASE_URL
  if (raw === '/' || raw === '') return undefined
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <AppProviders
        defaultTheme="light"
        enableSystem={false}
        storageKey="ben-ui-kit-theme-admin"
      >
        <App />
        <Toaster />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
