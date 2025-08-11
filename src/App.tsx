import './styles/app.scss';
import { Button, Glyph } from '@syren-dev-tech/confects/buttons';
import { Input } from '@syren-dev-tech/confects/inputs';
import { Page } from '@syren-dev-tech/confects/containers';
import { themes } from '@syren-dev-tech/confetti/themes';
import { uniqueKey } from '@syren-dev-tech/confects/helpers';
import { useActionState, useEffect, useRef, useState } from 'react';

interface SpinnerItem {
    key: number // Unique db key
    label: string
    weight: number
}

const DEGS = 360; // Full circle in degrees
const PERC = 100; // Percentage for conic-gradient
const INIT_DECAY = 0.01; // Initial decay for spin animation
const MIN_SPIN_SPEED = 5; // Minimum spin speed
const SPINUP_DECAY = 1.05; // Spin up decay factor
const SPINDOWN_DECAY = 0.991; // Spin down decay factor
const REVERSE_TARGET = 0.5; // Reverse target for spin animation
const ROT_OFFSET = 90; // Offset for initial rotation

// Get color from an index plus string
function getColor(index: number, n: number) {
    const colorIndex = (index * (DEGS / n)) % DEGS; // Ensure it's within 0-359
    return `hsl(${colorIndex}, 100%, 50%)`; // HSL color for better visibility
}

const SPIN_dROT = 10;

export default function App() {

    const [spinnerItems, setSpinnerItems] = useState<SpinnerItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<SpinnerItem | null>(null);

    const spinnerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { themes.init('dark', 'india'); }, []);
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
                setSpinnerItems(request.result);
            };
        };

        dbreq.onerror = (event) => {
            console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
        };
    }, []);

    const [
        error,
        submitAction,
        isPending
    ] = useActionState<Error | null, FormData>(
        (_previousState, formData) => {
            const itemLabel = formData.get('item_label') as string;

            if (!itemLabel)
                return new Error('Item label is required');


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
                        key: spinnerItems.length + 1, // Simple key generation
                        label: itemLabel,
                        weight: 1
                    });

                    // Update the spinner items state
                    const storedItems = store.getAll();
                    storedItems.onsuccess = () => {
                        setSpinnerItems(storedItems.result);
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

    const gradient = spinnerItems.map((_, i) => {
        return `${getColor(i, spinnerItems.length)} ${PERC * i / spinnerItems.length}% ${PERC * (i + 1) / spinnerItems.length}%`;
    });

    // eslint-disable-next-line no-magic-numbers
    const bgRotation = 2 * Math.PI;
    const dRot = bgRotation / spinnerItems.length;
    /*
     * 0% = offset of Math.PI / 2
     * So each slice would be offset by that plus the change in rotation to the next slice, plus half to center it
     */
    // eslint-disable-next-line no-magic-numbers
    const bgRotationOffset = Math.PI / 2 - dRot + dRot / 2;

    return <Page className={themes.getBasicStyling('body')}>
        <div className='spinner-container'>
            <div
                className='spinner'
                ref={spinnerRef}
                style={
                    {
                        backgroundImage: `conic-gradient(${gradient.join(', ')})`
                    }
                }
            >
                {
                    spinnerItems.map((item, n) => {
                        return <div
                            key={uniqueKey()}
                            className='spinner-item'
                            style={
                                {
                                    transform: `rotate(${bgRotation * n / spinnerItems.length - bgRotationOffset}rad) translateY(-50%)`
                                }
                            }
                        >
                            {item.label}
                        </div>;
                    })
                }
            </div>

            <div className='pointer'>
                <div className='marker' />

                <span>
                    {selectedItem?.label ?? '?'}
                </span>
            </div>
        </div>

        <div className='spinner-controls'>
            <Button
                className='spin-btn'
                disabled={spinnerItems.length <= 1}
                theme={{
                    background: { style: 'success' },
                    border: {
                        mono: -1,
                        style: 'success'
                    }
                }}
                onClick={
                    () => {
                        setSelectedItem(null);

                        let rotation = Number(spinnerRef.current?.style.transform.match(/rotate\((?<rotation>[-\d.]+)deg\)/)?.groups?.rotation);
                        if (isNaN(rotation)) rotation = 0;

                        let decay = INIT_DECAY;
                        const ds = Math.random() * SPIN_dROT + MIN_SPIN_SPEED;

                        let spinup = true;

                        const animateSpin = () => {
                            requestAnimationFrame(animateSpin);

                            if (!spinnerRef.current || !spinup && decay <= INIT_DECAY)
                                return;

                            if (spinup) {
                                if (decay <= ds)
                                    decay *= SPINUP_DECAY;
                                else
                                    spinup = false;

                                rotation = (rotation + MIN_SPIN_SPEED * decay) % DEGS;
                            }
                            else {
                                rotation = (rotation + ds * decay) % DEGS;
                                decay *= SPINDOWN_DECAY;
                            }

                            spinnerRef.current.style.transform = `rotate(${rotation}deg)`;

                            if (!spinup && decay < REVERSE_TARGET) {
                                const degPerItem = DEGS / spinnerItems.length;
                                let trueRot = (rotation - ROT_OFFSET) % DEGS; // Adjust for the initial offset of 90 degrees
                                if (trueRot < 0) trueRot += DEGS; // Ensure positive rotation
                                const modDeg = trueRot - (trueRot % degPerItem);
                                const index = Math.floor(modDeg / degPerItem);
                                const selected = spinnerItems[spinnerItems.length - 1 - index];

                                console.debug(degPerItem, trueRot, modDeg, index, getComputedStyle(spinnerRef.current).transform);

                                setSelectedItem(selected);
                            }
                        };

                        animateSpin();
                    }
                }
            >
                SPIN!
            </Button>

            <ul
                className='items-list'
            >
                {error && error.message}

                <form
                    action={submitAction}
                    className='spinner-form'
                >
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

                    <Glyph
                        submit
                        disabled={isPending}
                        icon='plus-lg'
                    />
                </form>

                {
                    spinnerItems.map((item, i) => {
                        return <li
                            key={uniqueKey()}
                            className='spinner-list-item'
                            style={
                                {
                                    backgroundColor: getColor(i, spinnerItems.length)
                                }
                            }
                        >
                            <span>
                                {item.label}
                            </span>

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
                                                    setSpinnerItems(storedItems.result);
                                                };
                                            };

                                            dbreq.onerror = (event) => {
                                                console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
                                            };
                                        }
                                    }
                                }
                            />
                        </li>;
                    })
                }
            </ul>
        </div>
    </Page >;
}
