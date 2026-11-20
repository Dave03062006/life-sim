import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/pixelify-sans'
import './styles/base.css'
import './minigames/minigames.css'
import './styles/flat.css'
import './styles/pixel.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
