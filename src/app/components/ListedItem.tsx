import './styles/listed-item.scss';
import type { HTML_ListItemProps } from '@syren-dev-tech/confects/types';
import type { SpinnerItem } from '../helpers/types';
import { getColor } from '../helpers/helpers';
import { useSpinner } from './Context';
import { Input } from '@syren-dev-tech/confects/inputs';
import { Glyph } from '@syren-dev-tech/confects/buttons';
import { useActionState } from 'react';
import { getClassName } from '@syren-dev-tech/confects/helpers';

interface ListedItemProps extends HTML_ListItemProps {
    item: SpinnerItem
}

const MAX_WEIGHT = 100; // Maximum weight for an item

export default function ListedItem(
    {
        item,
        ...props
    }: Readonly<ListedItemProps>
) {

    const { items, setItems, selectedItem } = useSpinner();

    const [
        error,
        submitAction,
        isPending
    ] = useActionState<Error | null, FormData>(
        (_previousState, formData) => {
            const itemLabel = formData.get('item_label') as string;
            const itemWeight = formData.get('item_weight') as string;

            if (!itemLabel)
                return new Error('Item label is required');
            if (!itemWeight || isNaN(Number(itemWeight)) || Number(itemWeight) < 1 || Number(itemWeight) > MAX_WEIGHT)
                return new Error('Item weight must be a number between 1 and 100');

            // Add the new item to IndexedDB
            if (window.indexedDB) {
                const dbreq = window.indexedDB.open('fate-gui', 1);

                dbreq.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains('spinner_items'))
                        db.createObjectStore('spinner_items', { keyPath: 'key' });
                };

                dbreq.onsuccess = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    const transaction = db.transaction('spinner_items', 'readwrite');
                    const store = transaction.objectStore('spinner_items');
                    store.put({
                        key: item.key,
                        label: itemLabel,
                        weight: Number(itemWeight)
                    });

                    // Update the spinner items state
                    const storedItems = store.getAll();
                    storedItems.onsuccess = () => {
                        setItems(storedItems.result);
                    };
                };

                dbreq.onerror = (event) => {
                    console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
                    return new Error('Failed to open IndexedDB');
                };
            }

            return null; // No error
        }, null
    );

    return <li
        {...props}
        className={getClassName('list-item', item === selectedItem && 'selected')}
        style={
            {
                backgroundColor: getColor(item.key - 1, items.length)
            }
        }
    >
        {error && error.message}

        <form
            action={submitAction}
            className='list-item-form'
        >
            <Input
                name='item_label'
                defaultValue={item.label}
                theme={
                    {
                        background: { style: 'body' },
                        border: {
                            mono: -1,
                            style: 'body'
                        }
                    }
                }
            />

            <Input
                type='number'
                name='item_weight'
                defaultValue={item.weight}
                theme={
                    {
                        background: { style: 'body' },
                        border: {
                            mono: -1,
                            style: 'body'
                        }
                    }
                }
            />

            <Glyph
                icon='pencil'
                submit
                disabled={isPending}
                theme={{
                    background: { style: 'primary' },
                    border: {
                        mono: -1,
                        style: 'primary'
                    }
                }}
            />
        </form>

        <Glyph
            icon='trash'
            onClick={
                () => {
                    if (window.indexedDB) {
                        const dbreq = window.indexedDB.open('fate-gui', 1);

                        dbreq.onsuccess = (event) => {
                            const db = (event.target as IDBOpenDBRequest).result;
                            const transaction = db.transaction('spinner_items', 'readwrite');
                            const store = transaction.objectStore('spinner_items');
                            store.delete(item.key);

                            // Update the spinner items state
                            const storedItems = store.getAll();
                            storedItems.onsuccess = () => {
                                setItems(storedItems.result);
                            };
                        };

                        dbreq.onerror = (event) => {
                            console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
                        };
                    }
                }
            }
            theme={{
                background: { style: 'hazard' },
                border: {
                    mono: -1,
                    style: 'hazard'
                }
            }}
        />
    </li >;
}