import { useEffect, useState } from "react";
import { useTimeBasedGradient } from "@/hooks/useTimeBasedGradient";

interface LoadingOverlayProps {
  isLoading: boolean;
  onFadeComplete?: () => void;
}

export function LoadingOverlay({ isLoading, onFadeComplete }: LoadingOverlayProps) {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isVisible, setIsVisible] = useState(isLoading);
  const { gradient, textColor } = useTimeBasedGradient();

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setIsVisible(true);
    } else {
      // Start fade out animation
      setIsVisible(false);
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        onFadeComplete?.();
      }, 500); // Match the fade-out duration
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFadeComplete]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundImage: gradient,
      }}
    >
      {/* Overlay for depth - same as main app */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>
      
      {/* Wave Animation Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Small White Wave Animation - Centered */}
        <div className="flex items-end justify-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-8 bg-white/90 rounded-full animate-wave"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
