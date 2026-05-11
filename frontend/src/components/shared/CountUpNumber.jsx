import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

export default function CountUpNumber({ end, suffix = '', prefix = '', duration = 1800 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const started = useRef(false);

    useEffect(() => {
        if (isInView && !started.current) {
            started.current = true;
            const startTime = Date.now();
            const tick = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.round(eased * end));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }
    }, [isInView, end, duration]);

    return <span ref={ref}>{prefix}{count}{suffix}</span>;
}