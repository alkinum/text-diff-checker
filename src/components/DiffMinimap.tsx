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
      const ratio = minimapHeight / containerHeight;

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

          const newRatio = newScrollTop / containerScrollHeight;
          setViewportPosition((prev) => ({
            ...prev,
            top: newRatio * minimapHeight,
          }));
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

  // Filter out spacer lines
  const nonSpacerLines = lines.filter((line) => !line.spacer);

  // Use maxTotalLines if provided, otherwise fall back to current side's line count
  // This ensures minimap scales consistently across both sides
  const totalLines = maxTotalLines || nonSpacerLines.length || 1; // Avoid division by zero

  // Function to find groups of consecutive added/removed/modified lines
  const findChangedLineGroups = () => {
    const groups: { start: number; end: number; type: 'added' | 'removed' | 'modified' | 'extra' }[] = [];
    let currentGroup: { start: number; end: number; type: 'added' | 'removed' | 'modified' | 'extra' } | null = null;

    // If no real lines, return no groups
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

  // Only render minimap if we have meaningful content
  if (nonSpacerLines.length === 0) {
    return null;
  }

  return (
    <div className={`absolute ${position === 'right' ? 'right-1.5' : 'right-1.5'} top-12 bottom-2 w-1.5 flex flex-col`}>
      <div ref={minimapRef} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full shadow-inner relative cursor-pointer overflow-hidden" onClick={handleMinimapClick}>
        {/* Show changed blocks in the minimap */}
        {changedGroups.map((group, i) => {
          // Calculate positions relative to the total maximum lines from both sides
          // This ensures that both minimaps use the same scale
          const top = Math.min(100, (group.start / totalLines) * 100);
          const height = Math.max(1, Math.min(100 - top, ((group.end - group.start + 1) / totalLines) * 100));

          let colorClass = '';

          // Only show relevant colors for each position
          if (position === 'left') {
            // Left side shows removals and modifications
            if (group.type === 'removed') colorClass = 'bg-red-500/80';
            else if (group.type === 'modified') colorClass = 'bg-blue-500/80';
            else if (group.type === 'extra') colorClass = 'bg-yellow-500/80';
          } else {
            // Right side shows additions and modifications
            if (group.type === 'added') colorClass = 'bg-green-500/80';
            else if (group.type === 'modified') colorClass = 'bg-blue-500/80';
          }

          if (!colorClass) return null;

          return (
            <div
              key={i}
              className={`absolute ${colorClass} w-full rounded-full`}
              style={{
                top: `${top}%`,
                height: `${Math.max(2, height)}%`,
              }}
            />
          );
        })}

        {/* Current viewport indicator - only show when not expanded */}
        {!isExpanded && (
          <div
            className={`absolute bg-white/40 dark:bg-gray-300/40 w-full backdrop-blur-sm shadow-sm ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} rounded`}
            style={{
              top: viewportPosition.top,
              height: Math.max(15, viewportPosition.height),
            }}
            onMouseDown={handleMouseDownOnViewport}
          />
        )}
      </div>
    </div>
  );
};

export default DiffMinimap;
