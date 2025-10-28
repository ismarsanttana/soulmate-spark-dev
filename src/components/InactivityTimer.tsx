import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { Clock, Minimize2, Maximize2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface InactivityTimerProps {
  onTimeout: () => void;
  timeoutMinutes?: number;
}

export const InactivityTimer = ({ onTimeout, timeoutMinutes = 30 }: InactivityTimerProps) => {
  const timeout = timeoutMinutes * 60 * 1000;
  const { timeRemaining } = useInactivityTimer({ timeout, onTimeout });
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('inactivity-timer-position');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 200, y: window.innerHeight - 120 };
  });
  
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeRemaining < 5 * 60 * 1000;
  const isCritical = timeRemaining < 2 * 60 * 1000;

  // Auto-expand when warning
  useEffect(() => {
    if (isWarning && isMinimized) {
      setIsMinimized(false);
    }
  }, [isWarning, isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('inactivity-timer-position', JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);

  const containerClasses = `
    fixed z-50 rounded-xl shadow-lg transition-all
    ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}
    ${isWarning ? 'bg-destructive/10 border-2 border-destructive' : 'bg-card border-2 border-border'}
    ${isMinimized ? 'w-14 h-14' : 'min-w-[180px]'}
  `;

  return (
    <div
      ref={dragRef}
      className={containerClasses}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isWarning ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
          }`}>
            <Clock className="h-5 w-5" />
          </div>
        </button>
      ) : (
        <div className="p-3 flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isCritical 
              ? 'bg-destructive text-destructive-foreground animate-pulse' 
              : isWarning 
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary/10 text-primary'
          }`}>
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-medium ${isWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
              Inatividade
            </div>
            <div className={`text-lg font-bold ${
              isWarning ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
