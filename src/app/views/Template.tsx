import './styles/template.scss';
import { Outlet } from 'react-router-dom';
import { Page } from '@syren-dev-tech/confects/containers';
import { themes } from '@syren-dev-tech/confetti/themes';
import ItemEntryForm from '../components/ItemEntryForm';
import ItemsList from '../components/ItemsList';

export default function Template() {
    return <Page className={themes.getBasicStyling('body')}>
        <Outlet />

        <div className='controls-container'>
            <ItemEntryForm />

            <ItemsList />
        </div>
    </Page>;
}