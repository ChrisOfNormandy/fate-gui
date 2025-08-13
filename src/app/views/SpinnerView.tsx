import './styles/spinner-view.scss';
import { useRef } from 'react';
import { Button } from '@syren-dev-tech/confects/buttons';
import { uniqueKey } from '@syren-dev-tech/confects/helpers';
import { getColor } from '../helpers/helpers';
import { useSpinner } from '../components/Context';

const SPIN_dROT = 10; // Spin speed in degrees per frame
const DEGS = 360; // Full circle in degrees
const PERC = 100; // Percentage for conic-gradient
const INIT_DECAY = 0.01; // Initial decay for spin animation
const MIN_SPIN_SPEED = 5; // Minimum spin speed
const SPINUP_DECAY = 1.05; // Spin up decay factor
const SPINDOWN_DECAY = 0.991; // Spin down decay factor
const REVERSE_TARGET = 0.5; // Reverse target for spin animation
const ROT_OFFSET = 90; // Offset for initial rotation
// eslint-disable-next-line no-magic-numbers
const TWOPI = Math.PI * 2; // Two times PI for full rotation
// eslint-disable-next-line no-magic-numbers
const HALFPI = Math.PI / 2; // Half PI for 90 degrees
const MOUSE_WHEEL_DELTA = 10; // Mouse wheel delta for rotation

export default function SpinnerView() {

    const { items, setSelectedItem } = useSpinner();

    const spinnerRef = useRef<HTMLDivElement>(null);

    const count = items.length;
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    // List of each item weight plus the weight of the previous items
    const cumulativeWeights = items.reduce((acc, item) => {
        const last = acc.length > 0 ? acc[acc.length - 1] : 0;
        acc.push(last + item.weight);
        return acc;
    }, [0] as number[]);
    /*
     * List of degrees for each item
     * If item 1 has a weight of 1 with a total weight of 3, it will take up 1/3 of the circle, or 120 degrees
     * If item 2 has a weight of 2, it will take up 2/3 of the circle, or 240 degrees
     */
    const itemDegrees = items.map((item) => {
        return (item.weight / totalWeight) * DEGS;
    }).reduce((acc, item) => {
        const last = acc.length > 0 ? acc[acc.length - 1] : 0;
        acc.push(last + item);
        return acc;
    }, [] as number[]);

    console.debug(cumulativeWeights, totalWeight);

    const gradient = items.map((item, i) => `${getColor(item.key - 1, count)} ${PERC * cumulativeWeights[i] / totalWeight}% ${PERC * cumulativeWeights[i + 1] / totalWeight}%`);


    const dRot = TWOPI / totalWeight;
    /*
     * 0% = offset of Math.PI / 2
     * So each slice would be offset by that plus the change in rotation to the next slice, plus half to center it
     */
    // eslint-disable-next-line no-magic-numbers
    const bgRotationOffset = HALFPI - dRot + dRot / 2;

    const getSelectedByRotation = (rotation: number) => {
        let trueRot = rotation - ROT_OFFSET; // Adjust for the initial offset of 90 degrees
        trueRot = (DEGS - trueRot) % DEGS;
        if (trueRot < 0) trueRot += DEGS; // Ensure positive rotation

        const selected = itemDegrees.findIndex(deg => trueRot <= deg);

        console.debug(trueRot, selected, itemDegrees);

        if (selected === -1)
            setSelectedItem(null);
        else
            setSelectedItem(items[selected]);
    };

    return <div className='spinner-container'>
        <div
            className='spinner'
        >
            <div
                className='spinner-wheel'
                ref={spinnerRef}
                style={
                    {
                        backgroundImage: `conic-gradient(${gradient.join(', ')})`
                    }
                }
                onWheel={
                    (event) => {
                        // Update element rotation on wheel scroll
                        if (!spinnerRef.current) return;
                        let rotation = Number(spinnerRef.current.style.transform.match(/rotate\((?<rotation>[-\d.]+)deg\)/)?.groups?.rotation);
                        if (isNaN(rotation)) rotation = 0;

                        const delta = event.deltaY > 0 ? -SPIN_dROT : SPIN_dROT; // Adjust rotation based on scroll direction
                        console.debug('Wheel rotation:', rotation, 'Delta:', delta);
                        rotation += delta / MOUSE_WHEEL_DELTA;
                        spinnerRef.current.style.transform = `rotate(${rotation}deg)`;
                        getSelectedByRotation(rotation);
                    }
                }
            >
                {
                    items.map((item, n) => {
                        return <div
                            key={uniqueKey()}
                            className='spinner-item'
                            style={
                                {
                                    // eslint-disable-next-line no-magic-numbers
                                    transform: `rotate(${TWOPI * cumulativeWeights[n] / totalWeight - bgRotationOffset + ((item.weight - 1) * dRot) / 2}rad) translateY(-50%)`
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
            </div>
        </div>

        <Button
            className='spin-btn'
            disabled={items.length <= 1}
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

                        if (!spinup && decay < REVERSE_TARGET)
                            getSelectedByRotation(rotation);
                    };

                    animateSpin();
                }
            }
        >
            SPIN!
        </Button>
    </div>;
}