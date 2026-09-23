import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
const theme = createTheme({
  palette: {
    primary: { main: '#245b4b' },
    secondary: { main: '#b77925' },
    background: { default: '#faf9f5', paper: '#ffffff' },
    text: { primary: '#233a32', secondary: '#61716a' },
  },
  typography: {
    fontFamily: '"Segoe UI", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
