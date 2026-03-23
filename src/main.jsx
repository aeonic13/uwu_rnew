import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProviders } from './contexts'
import AppRouter from './routes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
)
