import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AppProvider from './context/appContext.jsx'
import './style.css'

createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
    
  ,
)
