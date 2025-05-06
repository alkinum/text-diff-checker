
import React, { useEffect, useRef, useState } from 'react';
import { type DiffResultWithLineNumbers } from '@/utils/diffUtils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DiffMinimapProps {
  lines: DiffResultWithLineNumbers[];
  containerRef: React.RefObject<HTMLDivElement>;
  position: 'left' | 'right';
}

const DiffMinimap: React.FC<DiffMinimapProps> = ({ lines, containerRef, position }) => {
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

  // Function to find groups of consecutive added/removed lines
  const findChangedLineGroups = () => {
    const groups: { start: number, end: number, type: 'added' | 'removed' }[] = [];
    let currentGroup: { start: number, end: number, type: 'added' | 'removed' } | null = null;
    
    lines.forEach((line, index) => {
      if (line.added || line.removed) {
        const type = line.added ? 'added' : 'removed';
        
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
  const totalLines = lines.length;

  return (
    <div className={`absolute ${position === 'right' ? 'right-0' : 'right-0'} top-0 h-full w-6 flex flex-col`}>
      <div className="flex justify-center py-1">
        <ArrowUp className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div 
        ref={minimapRef}
        className="flex-1 mx-1 bg-muted/20 rounded relative cursor-pointer"
        onClick={handleMinimapClick}
      >
        {changedGroups.map((group, i) => {
          const top = (group.start / totalLines) * 100;
          const height = ((group.end - group.start + 1) / totalLines) * 100;
          const colorClass = group.type === 'added' ? 'bg-green-500/70' : 'bg-red-500/70';
          
          return (
            <div 
              key={i}
              className={`absolute ${colorClass} w-full`}
              style={{
                top: `${top}%`,
                height: `${Math.max(1, height)}%`
              }}
            />
          );
        })}
        
        <div 
          className="absolute bg-primary/30 border border-primary/50 w-full rounded"
          style={{
            top: viewportPosition.top,
            height: Math.max(10, viewportPosition.height)
          }}
        />
      </div>
      
      <div className="flex justify-center py-1">
        <ArrowDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default DiffMinimap;
