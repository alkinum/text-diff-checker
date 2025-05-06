
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
    const groups: { start: number, end: number, type: 'added' | 'removed' | 'modified' }[] = [];
    let currentGroup: { start: number, end: number, type: 'added' | 'removed' | 'modified' } | null = null;
    
    lines.forEach((line, index) => {
      let type: 'added' | 'removed' | 'modified' | null = null;
      if (line.added) type = 'added';
      else if (line.removed) type = 'removed';
      else if (line.modified) type = 'modified';
      
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
  const totalLines = lines.length;

  return (
    <div className={`absolute ${position === 'right' ? 'right-1' : 'right-1'} top-0 h-full w-2 flex flex-col`}>
      <div 
        ref={minimapRef}
        className="flex-1 bg-transparent rounded-sm relative cursor-pointer my-2"
        onClick={handleMinimapClick}
      >
        {changedGroups.map((group, i) => {
          const top = (group.start / totalLines) * 100;
          const height = ((group.end - group.start + 1) / totalLines) * 100;
          let colorClass = '';
          
          switch (group.type) {
            case 'added':
              colorClass = 'bg-green-500';
              break;
            case 'removed':
              colorClass = 'bg-red-500';
              break;
            case 'modified':
              colorClass = position === 'left' ? 'bg-red-400' : 'bg-green-400';
              break;
          }
          
          return (
            <div 
              key={i}
              className={`absolute ${colorClass} w-full rounded-sm`}
              style={{
                top: `${top}%`,
                height: `${Math.max(1, height)}%`,
                opacity: 0.8
              }}
            />
          );
        })}
        
        <div 
          className="absolute bg-gray-500/30 w-full rounded-sm"
          style={{
            top: viewportPosition.top,
            height: Math.max(10, viewportPosition.height),
            opacity: 0.8
          }}
        />
      </div>
    </div>
  );
};

export default DiffMinimap;
