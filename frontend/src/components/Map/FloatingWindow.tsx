import React, { useRef, useState, useEffect } from 'react';

export interface FloatingWindowProps {
  id: string;
  isOpen: boolean;
  onClose?: () => void;
  isMinimised?: boolean;
  onToggleMinimise?: () => void;
  isMaximised?: boolean;
  onToggleMaximise?: () => void;
  initialPosition: { x: number; y: number };
  initialSize: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
  onFocus?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  id,
  isOpen,
  isMinimised = false,
  isMaximised = false,
  initialPosition,
  initialSize,
  minWidth = 320,
  minHeight = 180,
  zIndex = 20,
  onFocus,
  children,
  className = ''
}) => {
  const storageKey = `emberwatch_window_v4_${id}`;

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_pos`);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.x >= 0 && p.x < window.innerWidth - 60 && p.y >= 50 && p.y < window.innerHeight - 50) {
          return p;
        }
      }
    } catch {}
    return initialPosition;
  });

  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_size`);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.width >= minWidth && s.height >= minHeight) {
          return s;
        }
      }
    } catch {}
    return initialSize;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0
  });

  const resizeRef = useRef<{
    dir: 'e' | 's' | 'se' | 'w' | 'sw';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  }>({
    dir: 'se',
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origW: 0,
    origH: 0
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_pos`, JSON.stringify(pos));
    } catch {}
  }, [pos, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_size`, JSON.stringify(size));
    } catch {}
  }, [size, storageKey]);

  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => ({
        x: Math.max(10, Math.min(window.innerWidth - size.width - 10, prev.x)),
        y: Math.max(70, Math.min(window.innerHeight - 60, prev.y))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size.width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, select, textarea, [role="button"], a');
    if (isInteractive) return;

    const dragHandle = target.closest('[data-drag-handle="true"], .window-drag-handle');
    if (!dragHandle) return;

    if (isMaximised) return;

    e.preventDefault();
    onFocus?.();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y
    };
  };

  const startResize = (e: React.MouseEvent, dir: 'e' | 's' | 'se' | 'w' | 'sw') => {
    if (isMaximised || isMinimised) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus?.();
    setIsResizing(true);
    resizeRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      origW: size.width,
      origH: size.height
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const currentHeight = isMinimised ? 44 : size.height;
        const maxX = Math.max(10, window.innerWidth - size.width - 10);
        const maxY = Math.max(70, window.innerHeight - currentHeight - 10);
        setPos({
          x: Math.max(10, Math.min(maxX, dragRef.current.origX + dx)),
          y: Math.max(70, Math.min(maxY, dragRef.current.origY + dy))
        });
      } else if (isResizing) {
        const { dir, startX, startY, origX, origW, origH } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newW = origW;
        let newH = origH;
        let newX = origX;

        if (dir === 'e' || dir === 'se') {
          newW = Math.max(minWidth, Math.min(window.innerWidth - pos.x - 10, origW + dx));
        }
        if (dir === 's' || dir === 'se' || dir === 'sw') {
          newH = Math.max(minHeight, Math.min(window.innerHeight - pos.y - 10, origH + dy));
        }
        if (dir === 'w' || dir === 'sw') {
          const possibleW = Math.max(minWidth, origW - dx);
          const computedX = origX + (origW - possibleW);
          if (computedX >= 10) {
            newW = possibleW;
            newX = computedX;
          }
        }

        setSize({ width: newW, height: newH });
        if (newX !== origX) {
          setPos((p) => ({ ...p, x: newX }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isMinimised, minHeight, minWidth, pos.x, pos.y, size.height, size.width]);

  if (!isOpen) return null;

  const windowStyle: React.CSSProperties = isMaximised
    ? {
        position: 'fixed',
        left: 16,
        top: 72,
        width: 'calc(100vw - 32px)',
        height: 'calc(100vh - 88px)',
        zIndex: zIndex + 20
      }
    : {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: isMinimised ? 44 : size.height,
        zIndex
      };

  return (
    <div
      onMouseDownCapture={() => onFocus?.()}
      onMouseDown={handleMouseDown}
      style={windowStyle}
      className={`subtle-glass rounded-lg border border-[var(--border)] shadow-xl flex flex-col overflow-hidden pointer-events-auto select-none transition-shadow ${
        isDragging ? 'shadow-2xl ring-1 ring-[var(--accent)]' : ''
      } ${className}`}
    ><div className="w-full h-full flex flex-col overflow-hidden relative">
        {children}
      </div>

      {!isMaximised && !isMinimised && (
        <>

          <div
            onMouseDown={(e) => startResize(e, 'e')}
            className="absolute top-11 bottom-3 right-0 w-2 cursor-ew-resize hover:bg-[var(--accent)]/30 transition-colors z-30"
            title="Drag horizontally to resize"
          />

          <div
            onMouseDown={(e) => startResize(e, 's')}
            className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize hover:bg-[var(--accent)]/30 transition-colors z-30"
            title="Drag vertically to resize"
          />

          <div
            onMouseDown={(e) => startResize(e, 'w')}
            className="absolute top-11 bottom-3 left-0 w-2 cursor-ew-resize hover:bg-[var(--accent)]/30 transition-colors z-30"
            title="Drag horizontally to resize"
          />

          <div
            onMouseDown={(e) => startResize(e, 'sw')}
            className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize hover:bg-[var(--accent)]/40 transition-colors z-40"
            title="Resize diagonally"
          />

          <div
            onMouseDown={(e) => startResize(e, 'se')}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 hover:bg-[var(--accent)]/40 transition-colors z-40 group"
            title="Resize window"
          >
            <svg
              className="w-2.5 h-2.5 text-[var(--border-strong)] group-hover:text-[var(--accent)] transition-colors pointer-events-none"
              viewBox="0 0 10 10"
              fill="none"
            >
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};
