import { X, Zap, Sparkles, Plug } from "lucide-react";

interface RecentSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionData {
  id: string;
  location: string;
  dateTime: string;
  duration: number;
  productivityRating: number;
  cleanliness: number;
  comment: string;
  outletAvailability: boolean;
  collaborators: string[];
}

const sessions: SessionData[] = [
  {
    id: "1",
    location: "Main stacks UC Berkeley",
    dateTime: "2025-10-25 14:30",
    duration: 120,
    productivityRating: 4,
    cleanliness: 4,
    comment: "Great study spot, quiet and peaceful. Perfect for deep focus.",
    outletAvailability: true,
    collaborators: ["Bryan Chen", "Sarah Johnson"],
  },
  {
    id: "2",
    location: "Café Saint Frank SF",
    dateTime: "2025-10-24 09:15",
    duration: 90,
    productivityRating: 3,
    cleanliness: 3,
    comment: "Busy time, but good coffee. Some background noise.",
    outletAvailability: false,
    collaborators: ["Andrew Smith"],
  },
  {
    id: "3",
    location: "Prince Street Pizza NYC",
    dateTime: "2025-10-23 16:45",
    duration: 75,
    productivityRating: 2,
    cleanliness: 3,
    comment: "Casual environment, lots of distractions. Good for informal meetings.",
    outletAvailability: true,
    collaborators: ["Mike Davis"],
  },
];

const getRatingColor = (rating: number) => {
  if (rating >= 4) return "bg-green-100 text-green-800";
  if (rating >= 2) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

export function RecentSessionsModal({ isOpen, onClose }: RecentSessionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">Recent Sessions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border-2 border-gray-300 rounded-2xl p-5 hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
            >
              {/* Location & Date/Time */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {session.location}
                </h3>
                <p className="text-sm text-gray-600">📅 {session.dateTime}</p>
              </div>

              {/* Duration */}
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Duration:</span> {session.duration} minutes
                </p>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Productivity Rating
                  </p>
                  <div className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${getRatingColor(session.productivityRating)}`}>
                    {session.productivityRating}/5
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Cleanliness
                  </p>
                  <div className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${getRatingColor(session.cleanliness)}`}>
                    {session.cleanliness}/5
                  </div>
                </div>
              </div>

              {/* Outlet Availability */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Plug className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">Outlets:</span>{" "}
                    {session.outletAvailability ? (
                      <span className="text-green-700 font-semibold">Available</span>
                    ) : (
                      <span className="text-red-700 font-semibold">Not Available</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Comment */}
              {session.comment && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Comment:</p>
                  <p className="text-sm text-gray-700 italic">{session.comment}</p>
                </div>
              )}

              {/* Collaborators */}
              {session.collaborators.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Studied with:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {session.collaborators.map((collaborator, idx) => (
                      <span
                        key={idx}
                        className="bg-orange-200 text-orange-900 px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        {collaborator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Close button */}
        <div className="border-t-2 border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
