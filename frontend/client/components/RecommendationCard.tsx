import { useState } from "react";

interface RecommendationCardProps {
  spotName: string;
  address: string;
  description: string;
  textColor: string;
  imageUrl?: string;
}

export function RecommendationCard({
  spotName,
  address,
  description,
  textColor,
  imageUrl,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Card with image as background */}
      <div 
        className="relative overflow-hidden border border-white/20 rounded-2xl p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-700 ease-out hover:border-white/30"
        onClick={handleClick}
      >
        {/* Semi-transparent background image with smooth expansion */}
        {imageUrl && (
          <div 
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out ${
              isExpanded ? 'opacity-45 scale-110' : 'opacity-20 scale-100'
            }`}
            style={{ 
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: isExpanded ? 'center center' : 'center center'
            }}
          />
        )}
        
        {/* Backdrop blur overlay with dynamic opacity */}
        <div 
          className={`absolute inset-0 backdrop-blur-sm transition-all duration-700 ease-out ${
            isExpanded ? 'bg-white/12' : 'bg-white/5'
          }`} 
        />
        
        {/* Content layer with smooth text movement */}
        <div className={`relative z-10 flex flex-col justify-center h-full transition-all duration-700 ease-out ${
          isExpanded ? 'transform translate-y-1' : 'transform translate-y-0'
        }`}>
          <h3 className={`font-bold mb-3 transition-all duration-700 ease-out ${
            isExpanded 
              ? 'text-xl md:text-2xl transform scale-105' 
              : 'text-lg md:text-xl transform scale-100'
          } ${textColor}`}>
            {spotName}
          </h3>
          
          <div className={`font-semibold mb-2 transition-all duration-700 ease-out ${
            isExpanded 
              ? 'text-base opacity-95 transform translate-x-1' 
              : 'text-sm opacity-90 transform translate-x-0'
          } ${textColor}`}>
            📍 {address}
          </div>
          
          <div className={`transition-all duration-700 ease-out ${
            isExpanded 
              ? 'text-sm opacity-85 line-clamp-4 transform translate-y-1' 
              : 'text-sm opacity-80 line-clamp-3 transform translate-y-0'
          } ${textColor}`}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
