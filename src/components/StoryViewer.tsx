import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface Story {
  id: string;
  title: string;
  media_url: string;
  media_type: string;
  link?: string | null;
  duration: number;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StoryViewer = ({
  stories,
  initialIndex,
  open,
  onOpenChange,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];
  const hasNext = currentIndex < stories.length - 1;
  const hasPrev = currentIndex > 0;

  useEffect(() => {
    if (!open) return;

    setProgress(0);
    const duration = (currentStory?.duration || 5) * 1000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (hasNext) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onOpenChange(false);
            return 0;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, open, hasNext, currentStory?.duration, onOpenChange]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, open]);

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[90vh] p-0 bg-black border-none">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {stories.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-20 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Navigation areas */}
          <div className="absolute inset-0 z-10 flex">
            <button
              className="flex-1 cursor-pointer"
              onClick={goToPrev}
              disabled={!hasPrev}
            />
            <button
              className="flex-1 cursor-pointer"
              onClick={goToNext}
            />
          </div>

          {/* Story content */}
          <div className="flex-1 relative overflow-hidden">
            <img
              src={currentStory.media_url}
              alt={currentStory.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Story info */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h3 className="text-white font-semibold text-lg mb-2">
              {currentStory.title}
            </h3>
            {currentStory.link && (
              <Link
                to={currentStory.link}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-2 text-white/90 text-sm hover:text-white"
              >
                Ver notícia completa
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Navigation arrows */}
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
