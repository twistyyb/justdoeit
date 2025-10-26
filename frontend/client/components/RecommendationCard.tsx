interface RecommendationCardProps {
  spotName: string;
  address: string;
  description: string;
  textColor: string;
}

export function RecommendationCard({
  spotName,
  address,
  description,
  textColor,
}: RecommendationCardProps) {
  return (
    <div className="mb-4">
      {/* Grouped transparent box */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
        <h3 className={`text-lg md:text-xl font-bold ${textColor} mb-2`}>
          {spotName}
        </h3>
        <div className={`text-sm font-semibold ${textColor} opacity-90 mb-2`}>
          📍 {address}
        </div>
        <div className={`text-sm ${textColor} opacity-80`}>
          {description}
        </div>
      </div>
    </div>
  );
}
