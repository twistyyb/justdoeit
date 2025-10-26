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
  return (
    <div className="flex-1 flex flex-col">
      {/* Card with image as background */}
      <div className="relative overflow-hidden border border-white/20 rounded-2xl p-5 flex-1 flex flex-col justify-between">
        {/* Semi-transparent background image */}
        {imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        
        {/* Backdrop blur overlay for better text readability */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        
        {/* Content layer */}
        <div className="relative z-10 flex flex-col justify-center h-full">
          <h3 className={`text-lg md:text-xl font-bold ${textColor} mb-3`}>
            {spotName}
          </h3>
          
          <div className={`text-sm font-semibold ${textColor} opacity-90 mb-2`}>
            📍 {address}
          </div>
          <div className={`text-sm ${textColor} opacity-80 line-clamp-3`}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
