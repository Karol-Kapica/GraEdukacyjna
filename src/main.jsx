import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CheckersLocal from './Checkers.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CheckersLocal />
  </StrictMode>,
)
