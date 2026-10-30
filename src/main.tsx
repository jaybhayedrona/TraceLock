import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Mark that production JavaScript bundle has executed successfully
if (typeof window !== 'undefined') {
  (window as any).__TRACE_LOCK_BUNDLED__ = true;
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

