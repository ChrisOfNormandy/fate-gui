import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { SpinnerItem } from '../helpers/types';

interface ISpinnerContext {
    items: SpinnerItem[]
    setItems: Dispatch<SetStateAction<SpinnerItem[]>>
    selectedItem: SpinnerItem | null
    setSelectedItem: Dispatch<SetStateAction<SpinnerItem | null>>
}

const SpinnerContext = createContext<ISpinnerContext>(
    {
        items: [],
        selectedItem: null,
        setItems: () => null,
        setSelectedItem: () => null
    }
);

export default function SpinnerContextProvider(
    { children }: { children: ReactNode }
) {
    const [items, setItems] = useState<SpinnerItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<SpinnerItem | null>(null);

    useEffect(() => {
        // Load spinner items from IndexedDB

        if (!window.indexedDB) {
            console.error('IndexedDB is not supported in this browser.');
            return;
        }

        const dbreq = window.indexedDB.open('fate-gui', 1);

        dbreq.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('spinner_items'))
                db.createObjectStore('spinner_items', { keyPath: 'key' });
        };

        dbreq.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction('spinner_items', 'readonly');
            const store = transaction.objectStore('spinner_items');
            const request = store.getAll();
            request.onsuccess = () => {
                setItems(request.result);
            };
        };

        dbreq.onerror = (event) => {
            console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
        };
    }, []);

    const context = useMemo(() => {
        return {
            items,
            selectedItem,
            setItems,
            setSelectedItem
        };
    }, [items, selectedItem]);

    return (
        <SpinnerContext.Provider value={context}>
            {children}
        </SpinnerContext.Provider>
    );
}

export function useSpinner() {
    return useContext(SpinnerContext);
}