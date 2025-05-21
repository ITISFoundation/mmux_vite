import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { setupTheme } from './theme.ts';
const theme = setupTheme();


createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
      <App />
  </ThemeProvider >,
)
