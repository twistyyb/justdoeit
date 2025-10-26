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
    <div className="mb-3">
      {/* Grouped transparent box */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-3">
        <h3 className={`text-base md:text-lg font-bold ${textColor} mb-2`}>
          {spotName}
        </h3>
        
        {/* Image */}
        {imageUrl && (
          <div className="mb-2 flex justify-center">
            <div className="rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', height: '80px', width: 'auto' }}>
              <img 
                src={imageUrl} 
                alt={spotName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
        
        <div className={`text-xs font-semibold ${textColor} opacity-90 mb-1.5`}>
          📍 {address}
        </div>
        <div className={`text-xs ${textColor} opacity-80 line-clamp-2`}>
          {description}
        </div>
      </div>
    </div>
  );
}
