interface RecommendationCardProps {
  spotName: string;
  address: string;
  description: string;
}

export function RecommendationCard({
  spotName,
  address,
  description,
}: RecommendationCardProps) {
  return (
    <div className="mb-4">
      {/* Emphasized spot name */}
      <h3 className="text-lg md:text-xl font-bold text-orange-700 mb-3">
        {spotName}
      </h3>

      {/* Information box */}
      <div className="bg-orange-200/80 backdrop-blur-sm border-2 border-orange-400 rounded-2xl p-4">
        <div className="text-sm font-semibold text-gray-900 mb-2">
          📍 {address}
        </div>
        <div className="text-sm text-gray-700">
          {description}
        </div>
      </div>
    </div>
  );
}
