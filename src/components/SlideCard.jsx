import { animated, useTransition } from '@react-spring/web';

export default function SlideCard({ step, direction, children }) {
  const transitions = useTransition(step, {
    from: { opacity: 0, transform: `translateX(${direction === 'back' ? '-100%' : '100%'})` },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: `translateX(${direction === 'back' ? '100%' : '-100%'})` },
    config: { duration: 300 },
  });
  return <div className="slide-shell">{transitions((style) => <animated.div style={style} className="slide-card">{children}</animated.div>)}</div>;
}
