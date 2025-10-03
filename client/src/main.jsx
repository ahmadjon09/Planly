import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './global.css'
import './assets/css/nav.css'
import { LanguageProvider } from './context/LanguageContext.jsx'
import ContextProvider from './Context/Context.jsx'

createRoot(document.getElementById('root')).render(
  <ContextProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ContextProvider>
)
