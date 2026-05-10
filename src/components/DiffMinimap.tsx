import React, { useEffect, useRef, useState } from 'react';
import { type DiffResultWithLineNumbers } from '@/utils/diff/types';

interface DiffMinimapProps {
  lines: DiffResultWithLineNumbers[];
  containerRef: React.RefObject<HTMLDivElement>;
  position: 'left' | 'right';
  isExpanded?: boolean;
  maxTotalLines?: number;
}

const DiffMinimap: React.FC<DiffMinimapProps> = ({ lines, containerRef, position, isExpanded = false, maxTotalLines }) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [viewportPosition, setViewportPosition] = useState({ top: 0, height: 30 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateViewport = () => {
      const containerHeight = container.scrollHeight;
      const viewportHeight = container.clientHeight;
      const scrollTop = container.scrollTop;

      const minimapHeight = minimapRef.current?.clientHeight || 100;
      // Prevent division by zero if containerHeight is 0
      const ratio = containerHeight > 0 ? minimapHeight / containerHeight : 0;

      setViewportPosition({
        top: scrollTop * ratio,
        height: viewportHeight * ratio,
      });
    };

    updateViewport();
    container.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      container.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [containerRef, lines, isExpanded]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (!containerRef.current || !minimapRef.current) return;

    const minimapRect = minimapRef.current.getBoundingClientRect();
    const clickPosition = e.clientY - minimapRect.top;
    const ratio = containerRef.current.scrollHeight / minimapRef.current.clientHeight;

    containerRef.current.scrollTop = clickPosition * ratio;
  };

  const handleMouseDownOnViewport = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current || !minimapRef.current) return;

    const containerScrollHeight = containerRef.current.scrollHeight;
    const containerClientHeight = containerRef.current.clientHeight;
    const minimapHeight = minimapRef.current.clientHeight;

    if (containerClientHeight >= containerScrollHeight) return;

    setIsDragging(true);

    const initialMouseY = e.clientY;
    const initialScrollTop = containerRef.current.scrollTop;

    const handleDragMove = (e: MouseEvent) => {
      if (!minimapRef.current || !containerRef.current) return;

      const mouseDeltaY = e.clientY - initialMouseY;
      const scrollRatio = minimapHeight / containerScrollHeight;
      const scrollDelta = mouseDeltaY / scrollRatio;

      let newScrollTop = initialScrollTop + scrollDelta;
      newScrollTop = Math.max(0, newScrollTop);
      newScrollTop = Math.min(containerScrollHeight - containerClientHeight, newScrollTop);

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = newScrollTop;
          // Viewport position updates via the scroll listener
        }
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
    };

    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const nonSpacerLines = lines.filter((line) => !line.spacer);
  const totalLines = maxTotalLines || nonSpacerLines.length || 1;

  const findChangedLineGroups = () => {
    const groups: { start: number; end: number; type: 'added' | 'removed' | 'modified' | 'extra' }[] = [];
    let currentGroup: { start: number; end: number; type: 'added' | 'removed' | 'modified' | 'extra' } | null = null;

    if (nonSpacerLines.length === 0) return groups;

    nonSpacerLines.forEach((line, index) => {
      let type: 'added' | 'removed' | 'modified' | 'extra' | null = null;
      if (line.added) type = 'added';
      else if (line.removed) type = 'removed';
      else if (line.modified) type = 'modified';
      else if (line.extraLine) type = 'extra';

      if (type) {
        if (!currentGroup) {
          currentGroup = { start: index, end: index, type };
        } else if (currentGroup.type === type) {
          currentGroup.end = index;
        } else {
          groups.push(currentGroup);
          currentGroup = { start: index, end: index, type };
        }
      } else if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const changedGroups = findChangedLineGroups();

  if (nonSpacerLines.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-1 top-2 bottom-2 w-3 flex flex-col z-10 transition-opacity hover:opacity-100 opacity-60">
      <div 
        ref={minimapRef} 
        className="flex-1 bg-muted rounded-full relative cursor-pointer overflow-hidden border border-border/50" 
        onClick={handleMinimapClick}
      >
        {changedGroups.map((group, i) => {
          const top = Math.min(100, (group.start / totalLines) * 100);
          const height = Math.max(1, Math.min(100 - top, ((group.end - group.start + 1) / totalLines) * 100));

          let colorClass = '';
          if (position === 'left') {
            if (group.type === 'removed') colorClass = 'bg-red-500';
            else if (group.type === 'modified') colorClass = 'bg-blue-500';
            else if (group.type === 'extra') colorClass = 'bg-yellow-500';
          } else {
            if (group.type === 'added') colorClass = 'bg-green-500';
            else if (group.type === 'modified') colorClass = 'bg-blue-500';
          }

          if (!colorClass) return null;

          return (
            <div
              key={i}
              className={`absolute ${colorClass} w-full rounded-sm opacity-80`}
              style={{
                top: `${top}%`,
                height: `${Math.max(2, height)}%`,
              }}
            />
          );
        })}

        {!isExpanded && (
          <div
            className={`absolute bg-foreground/20 hover:bg-foreground/30 w-full rounded-sm ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} transition-colors`}
            style={{
              top: viewportPosition.top,
              height: Math.max(10, viewportPosition.height),
            }}
            onMouseDown={handleMouseDownOnViewport}
          />
        )}
      </div>
    </div>
  );
};

export default DiffMinimap;
