
import React, { useEffect, useRef, useState } from 'react';
import { type DiffResultWithLineNumbers } from '@/utils/diff/types';

interface DiffMinimapProps {
  lines: DiffResultWithLineNumbers[];
  containerRef: React.RefObject<HTMLDivElement>;
  position: 'left' | 'right';
  isExpanded?: boolean;
}

const DiffMinimap: React.FC<DiffMinimapProps> = ({ lines, containerRef, position, isExpanded = false }) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [viewportPosition, setViewportPosition] = useState({ top: 0, height: 30 });
  
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
        height: viewportHeight * ratio
      });
    };

    updateViewport();
    container.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    
    return () => {
      container.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [containerRef]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !minimapRef.current) return;
    
    const minimapRect = minimapRef.current.getBoundingClientRect();
    const clickPosition = e.clientY - minimapRect.top;
    const ratio = containerRef.current.scrollHeight / minimapRef.current.clientHeight;
    
    containerRef.current.scrollTop = clickPosition * ratio;
  };

  // Filter out spacer lines
  const nonSpacerLines = lines.filter(line => !line.spacer);
  const totalLines = nonSpacerLines.length;
  
  // Function to find groups of consecutive added/removed/modified lines
  const findChangedLineGroups = () => {
    const groups: { start: number, end: number, type: 'added' | 'removed' | 'modified' | 'extra' }[] = [];
    let currentGroup: { start: number, end: number, type: 'added' | 'removed' | 'modified' | 'extra' } | null = null;
    
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

  return (
    <div className={`absolute ${position === 'right' ? 'right-1.5' : 'right-1.5'} top-12 bottom-2 w-1.5 flex flex-col`}>
      <div 
        ref={minimapRef}
        className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full shadow-inner relative cursor-pointer overflow-hidden"
        onClick={handleMinimapClick}
      >
        {/* Show changed blocks in the minimap */}
        {changedGroups.map((group, i) => {
          const top = (group.start / totalLines) * 100;
          const height = Math.max(1, ((group.end - group.start + 1) / totalLines) * 100);
          
          let colorClass = '';
          switch (group.type) {
            case 'added':
              colorClass = position === 'left' ? '' : 'bg-green-500/80';
              break;
            case 'removed':
              colorClass = position === 'left' ? 'bg-red-500/80' : '';
              break;
            case 'modified':
              colorClass = position === 'left' ? 'bg-blue-500/80' : 'bg-blue-500/80';
              break;
            case 'extra':
              colorClass = position === 'left' ? 'bg-yellow-500/80' : '';
              break;
          }
          
          if (!colorClass) return null;
          
          return (
            <div 
              key={i}
              className={`absolute ${colorClass} w-full`}
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
            className="absolute bg-white/40 dark:bg-gray-300/40 w-full backdrop-blur-sm shadow-sm"
            style={{
              top: viewportPosition.top,
              height: Math.max(15, viewportPosition.height),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DiffMinimap;
