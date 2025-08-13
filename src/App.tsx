import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { themes } from '@syren-dev-tech/confetti/themes';
import { useEffect } from 'react';
import SpinnerContextProvider from './app/components/Context';
import SpinnerView from './app/views/SpinnerView';
import Template from './app/views/Template';

export default function App() {
    useEffect(() => { themes.init('dark', 'india'); }, []);

    return <BrowserRouter>
        <Routes>
            <Route path='/' element={
                <SpinnerContextProvider>
                    <Template />
                </SpinnerContextProvider>
            }>
                <Route path='/' element={<SpinnerView />} />
            </Route>
        </Routes>
    </BrowserRouter>;
}
