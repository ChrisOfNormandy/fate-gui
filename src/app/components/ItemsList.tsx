import './styles/items-list.scss';
import { uniqueKey } from '@syren-dev-tech/confects/helpers';
import { useSpinner } from './Context';
import ListedItem from './ListedItem';

export default function ItemsList() {

    const { items } = useSpinner();

    return <ul
        className='items-list'
    >
        {
            items.map((item) => {
                return <ListedItem
                    key={uniqueKey()}
                    item={item}
                />;
            })
        }
    </ul>;
}