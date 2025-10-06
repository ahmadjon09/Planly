import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './global.css'
import './assets/css/nav.css'
import { ContextProvider } from './context/ContextT.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <ContextProvider>
      <App />
    </ContextProvider>
  </LanguageProvider>
)
