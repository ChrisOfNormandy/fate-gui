import './styles/item-entry-form.scss';
import { useActionState } from 'react';
import { useSpinner } from './Context';
import { Input } from '@syren-dev-tech/confects/inputs';
import { Glyph } from '@syren-dev-tech/confects/buttons';

const MAX_WEIGHT = 100; // Maximum weight for an item

export default function ItemEntryForm() {
    const { items, setItems } = useSpinner();

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
                    store.add({
                        key: items.length + 1, // Simple key generation
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

    return <form
        action={submitAction}
        className='item-entry-form'
    >
        {error && error.message}

        <Input
            name='item_label'
            required
            placeholder='New Item'
            theme={{
                background: { style: 'content' },
                border: {
                    mono: -1,
                    style: 'content'
                }
            }}
        />

        <Input
            defaultValue={1}
            max={100}
            min={1}
            name='item_weight'
            placeholder='Item Weight'
            required
            step={1}
            type='number'
            theme={{
                background: { style: 'content' },
                border: {
                    mono: -1,
                    style: 'content'
                }
            }}
        />

        <Glyph
            submit
            disabled={isPending}
            icon='plus-lg'
            theme={{
                background: { style: 'primary' },
                border: {
                    mono: -1,
                    style: 'primary'
                }
            }}
        />
    </form>;
}