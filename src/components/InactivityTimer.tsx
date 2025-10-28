import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { Clock } from "lucide-react";

interface InactivityTimerProps {
  onTimeout: () => void;
  timeoutMinutes?: number;
}

export const InactivityTimer = ({ onTimeout, timeoutMinutes = 30 }: InactivityTimerProps) => {
  const timeout = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
  const { timeRemaining } = useInactivityTimer({ timeout, onTimeout });

  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Only show when less than 5 minutes remaining
  const shouldShow = timeRemaining < 5 * 60 * 1000;

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-2.5 min-w-[160px]">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          timeRemaining < 2 * 60 * 1000 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        }`}>
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Inatividade</div>
          <div className={`text-lg font-bold ${
            timeRemaining < 2 * 60 * 1000 ? 'text-destructive' : 'text-foreground'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
};
