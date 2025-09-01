import React from 'react';

function SpotlightCard({ className = '', spotlightColor = 'rgba(79, 70, 229, 0.15)', radius = 240, children }) {
  const containerRef = React.useRef(null);
  const [spot, setSpot] = React.useState({ x: 0, y: 0, active: false });

  const onMove = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpot({ x, y, active: true });
  };

  const onLeave = () => setSpot((s) => ({ ...s, active: false }));

  const overlayStyle = {
    background: `radial-gradient(${radius}px ${radius}px at ${spot.x}px ${spot.y}px, ${spotlightColor}, transparent 70%)`,
    opacity: spot.active ? 1 : 0,
    transition: 'opacity 150ms ease-out',
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseEnter={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute inset-0" style={overlayStyle} />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export default SpotlightCard;