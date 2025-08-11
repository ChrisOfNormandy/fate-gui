import './styles/main.scss';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';

createRoot(document.getElementById('root') ?? document.body).render(
    <StrictMode>
        <App />
    </StrictMode>
);
