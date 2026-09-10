import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode removed: in dev it double-invokes effects and event handlers,
// which doubled every initial API request (auth, products, unread) and made
// the dashboard feel twice as slow to load.
createRoot(document.getElementById('root')).render(
  <App />,
)
