import { useState, useRef, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { Sun, Moon, MessageSquare, Mic, HeadphonesIcon } from "lucide-react";
import VoiceInterface from "./VoiceInterface";

export const ControlCenter = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 350 });
  const [savedPosition, setSavedPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 350 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragRef.current || isOpen) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragRef.current.startX;
    const deltaY = touch.clientY - dragRef.current.startY;
    
    const newX = Math.max(20, Math.min(window.innerWidth - 76, dragRef.current.initialX + deltaX));
    const newY = Math.max(80, Math.min(window.innerHeight - 150, dragRef.current.initialY + deltaY));
    
    setPosition({ x: newX, y: newY });
  };

  const snapToSide = (currentX: number, currentY: number) => {
    const centerX = window.innerWidth / 2;
    const isLeftSide = currentX < centerX;
    const newX = isLeftSide ? 20 : window.innerWidth - 76;
    
    setIsAnimating(true);
    setPosition({ x: newX, y: currentY });
    setSavedPosition({ x: newX, y: currentY });
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const moveToCenter = () => {
    const centerX = window.innerWidth / 2 - 28;
    const centerY = window.innerHeight / 2 - 28;
    
    setIsAnimating(true);
    setPosition({ x: centerX, y: centerY });
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const distance = Math.sqrt(
      Math.pow(touch.clientX - (dragRef.current?.startX || 0), 2) +
      Math.pow(touch.clientY - (dragRef.current?.startY || 0), 2)
    );
    
    setIsDragging(false);
    
    if (distance < 10) {
      if (!isOpen) {
        moveToCenter();
        setTimeout(() => setIsOpen(true), 300);
      } else {
        setIsOpen(false);
        setTimeout(() => {
          setIsAnimating(true);
          setPosition(savedPosition);
          setTimeout(() => setIsAnimating(false), 300);
        }, 100);
      }
    } else {
      snapToSide(position.x, position.y);
    }
    
    dragRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || isOpen) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(20, Math.min(window.innerWidth - 76, dragRef.current.initialX + deltaX));
      const newY = Math.max(80, Math.min(window.innerHeight - 150, dragRef.current.initialY + deltaY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragRef.current) return;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragRef.current.startX, 2) +
        Math.pow(e.clientY - dragRef.current.startY, 2)
      );
      
      setIsDragging(false);
      
      if (distance < 10) {
        if (!isOpen) {
          moveToCenter();
          setTimeout(() => setIsOpen(true), 300);
        } else {
          setIsOpen(false);
          setTimeout(() => {
            setIsAnimating(true);
            setPosition(savedPosition);
            setTimeout(() => setIsAnimating(false), 300);
          }, 100);
        }
      } else {
        snapToSide(position.x, position.y);
      }
      
      dragRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isOpen]);

  const menuItems = [
    {
      icon: theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
      label: theme === "dark" ? "Tema Claro" : "Tema Escuro",
      onClick: () => {
        toggleTheme();
        setIsOpen(false);
      },
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Assistente Chat",
      onClick: () => {
        // TODO: Implementar abertura do chat
        console.log("Abrir chat");
        setIsOpen(false);
      },
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Mic className="w-5 h-5" />,
      label: "Assistente Voz",
      onClick: () => {
        setShowVoiceInterface(true);
        setIsOpen(false);
      },
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <HeadphonesIcon className="w-5 h-5" />,
      label: "Suporte",
      onClick: () => {
        // TODO: Implementar chamada de suporte
        console.log("Abrir suporte");
        setIsOpen(false);
      },
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <>
      {/* Voice Interface Modal */}
      {showVoiceInterface && (
        <VoiceInterface 
          onClose={() => {
            setShowVoiceInterface(false);
            // Volta para a lateral quando fechar a conversa de voz
            setTimeout(() => {
              snapToSide(position.x, position.y);
            }, 100);
          }} 
        />
      )}

      {/* Overlay quando o menu está aberto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => {
            setIsOpen(false);
            setTimeout(() => {
              setIsAnimating(true);
              setPosition(savedPosition);
              setTimeout(() => setIsAnimating(false), 300);
            }, 100);
          }}
        />
      )}

      {/* Botão principal */}
      <div
        className={`fixed touch-none ${isOpen ? "z-50" : "z-40"}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transition: isAnimating ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none"
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <button
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg transition-all duration-300 ${
            isDragging ? "scale-110" : "scale-100"
          } ${isOpen ? "shadow-2xl" : "hover:scale-110"}`}
        >
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
          </div>
        </button>

        {/* Menu expansível */}
        {isOpen && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {menuItems.map((item, index) => {
              const angle = (index * (Math.PI * 2)) / menuItems.length - Math.PI / 2;
              const radius = 90;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`absolute flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    animation: `fadeInScale 0.3s ease-out ${index * 0.05}s both`,
                  }}
                  title={item.label}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};
