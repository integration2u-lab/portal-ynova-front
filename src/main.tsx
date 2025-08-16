import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

const client = new QueryClient({
  defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
        <Toaster richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)