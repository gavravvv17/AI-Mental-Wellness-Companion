import React, { useRef, useState, useCallback } from 'react';

/**
 * CustomSlider – drag-stable slider using the Pointer Capture API.
 *
 * WHY POINTER CAPTURE?
 *  The previous implementation attached mousemove/mouseup to window inside a
 *  useEffect with [moveDrag, endDrag] as dependencies. Because the parent passes
 *  a new onChange arrow-function on every render, moveDrag's identity changed on
 *  every drag tick, causing the useEffect to tear down and re-add the global
 *  listeners mid-drag. During that brief gap the drag silently stopped.
 *
 *  setPointerCapture() is the browser-native fix: after pointerdown, ALL
 *  pointermove and pointerup events are guaranteed to fire on the captured
 *  element for the entire drag lifetime, regardless of where the cursor goes.
 *  No global listeners, no useEffect cleanup, no race condition.
 *
 * Props:
 *  min, max, step   – range config
 *  value            – controlled value (number)
 *  onChange(n)      – called with the new numeric value
 *  color            – accent hex/css color
 *  showTicks        – renders integer tick labels below the track
 *  label            – ARIA label string
 *  id               – element id
 *  disabled         – disables all interaction
 */
const CustomSlider = ({
  min = 0,
  max = 10,
  step = 1,
  value,
  onChange,
  color = '#8b5cf6',
  showTicks = false,
  label = 'Slider',
  id,
  disabled = false,
}) => {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  /* ── helpers ── */

  const snap = (raw) => {
    const snapped = Math.round(raw / step) * step;
    // toFixed(10) prevents floating-point drift e.g. 0.30000000004
    return Math.min(max, Math.max(min, parseFloat(snapped.toFixed(10))));
  };

  const clientXToValue = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(fraction * (max - min) + min);
  };

  /* ── pointer events (capture-based, interruption-proof) ── */

  const handlePointerDown = useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      // Capture: ALL subsequent pointermove/pointerup go to this element
      // until releasePointerCapture fires on pointerup. The cursor can leave
      // the window entirely and the drag still works.
      trackRef.current.setPointerCapture(e.pointerId);
      setIsDragging(true);
      onChange(clientXToValue(e.clientX));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, min, max, step, onChange]
  );

  const handlePointerMove = useCallback(
    (e) => {
      // Only fires while we have the capture (i.e. button is held)
      if (e.buttons === 0) return;
      onChange(clientXToValue(e.clientX));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, onChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    // Pointer capture is released automatically on pointerup by the browser,
    // but calling it explicitly is harmless and makes intent clear.
  }, []);

  /* ── keyboard ── */

  const handleKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      let next = value;
      if      (e.key === 'ArrowRight' || e.key === 'ArrowUp')   next = Math.min(max, value + step);
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') next = Math.max(min, value - step);
      else if (e.key === 'Home') next = min;
      else if (e.key === 'End')  next = max;
      else return;
      e.preventDefault();
      onChange(parseFloat(next.toFixed(10)));
    },
    [disabled, value, min, max, step, onChange]
  );

  /* ── derived ── */

  const fillPercent = ((value - min) / (max - min)) * 100;
  const ticks = showTicks
    ? Array.from({ length: max - min + 1 }, (_, i) => min + i)
    : [];

  /* ── render ── */

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none', width: '100%' }}>

      {/* ── Track hit area ── */}
      <div
        ref={trackRef}
        id={id}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          touchAction: 'none', // prevents browser panning from competing with drag
        }}
      >
        {/* ── Track background ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '7px',
            borderRadius: '9999px',
            background: '#E2E6ED',
            overflow: 'visible',
          }}
        >
          {/* Filled portion */}
          <div
            style={{
              height: '100%',
              width: `${fillPercent}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              borderRadius: '9999px',
              transition: isDragging ? 'none' : 'width 0.1s ease',
            }}
          />
        </div>

        {/* ── Thumb ── */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${fillPercent}% - 11px)`,
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#ffffff',
            border: `3px solid ${color}`,
            boxShadow: isDragging
              ? `0 0 0 6px ${color}22, 0 3px 12px rgba(0,0,0,0.18)`
              : '0 2px 6px rgba(0,0,0,0.14)',
            transition: isDragging
              ? 'box-shadow 0.1s ease'
              : 'left 0.1s ease, box-shadow 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none', // thumb is visual only; track handles events
            zIndex: 2,
          }}
        >
          {/* Tooltip bubble while dragging */}
          {isDragging && (
            <div
              style={{
                position: 'absolute',
                bottom: '130%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: color,
                color: '#fff',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                pointerEvents: 'none',
              }}
            >
              {value}
            </div>
          )}

          {/* Inner dot */}
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: color,
              opacity: 0.75,
            }}
          />
        </div>
      </div>

      {/* ── Tick labels (energy slider only) ── */}
      {showTicks && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            paddingLeft: '1px',
            paddingRight: '1px',
          }}
        >
          {ticks.map((tick) => {
            const isActive = tick === value;
            return (
              <span
                key={tick}
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? '800' : '500',
                  color: isActive ? color : '#9ca3af',
                  background: isActive ? `${color}1a` : 'transparent',
                  borderRadius: '6px',
                  padding: isActive ? '1px 4px' : '1px 2px',
                  minWidth: '14px',
                  textAlign: 'center',
                  transition: 'color 0.15s, background 0.15s',
                  lineHeight: '1.5',
                  userSelect: 'none',
                  display: 'inline-block',
                }}
              >
                {tick}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSlider;
