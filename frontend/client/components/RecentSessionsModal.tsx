import { useEffect, useState } from "react";
import { X, Plug } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SessionDetails, UserRecentSessionsResponse } from "shared/api";

interface RecentSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRatingColor = (rating: number) => {
  if (rating >= 4) return "bg-green-100 text-green-800";
  if (rating >= 2) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

export function RecentSessionsModal({ isOpen, onClose }: RecentSessionsModalProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:5002/user_recent_sessions/${user.id}?limit=10`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }
        
        const data: UserRecentSessionsResponse = await response.json();
        setSessions(data.sessions);
        
        // Fetch user names for all creators
        const allCreatorIds = new Set<string>();
        data.sessions.forEach(session => {
          if (session.creators) {
            session.creators.forEach(id => allCreatorIds.add(id));
          }
        });
        
        // Fetch names for all unique creators
        const namesMap = new Map<string, string>();
        for (const creatorId of allCreatorIds) {
          try {
            const userResponse = await fetch(
              `http://127.0.0.1:5002/user_profile/${creatorId}`
            );
            if (userResponse.ok) {
              const userData = await userResponse.json();
              namesMap.set(creatorId, userData.name || 'Unknown User');
            }
          } catch (error) {
            console.error(`Error fetching user ${creatorId}:`, error);
            namesMap.set(creatorId, 'Unknown User');
          }
        }
        setUserNames(namesMap);
      } catch (error) {
        console.error("Error fetching recent sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [isOpen, user?.id]);

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
          {isLoading ? (
            <div className="text-center py-8 text-gray-600">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No sessions found. Start logging your study sessions!
            </div>
          ) : (
            sessions.map((session) => {
              // Format date/time
              const dateTime = session.inputtime 
                ? new Date(session.inputtime).toLocaleString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'N/A';
              
              // Get collaborator names (exclude current user)
              const collaboratorNames = session.creators
                ?.filter(id => id !== user?.id)
                .map(id => userNames.get(id) || 'Unknown User')
                .filter(Boolean) || [];
              
              return (
                <div
                  key={session.id}
                  className="border-2 border-gray-300 rounded-2xl p-5 hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
                >
                  {/* Location & Date/Time */}
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {session.location_name}
                    </h3>
                    <p className="text-sm text-gray-600">📅 {dateTime}</p>
                  </div>

                  {/* Duration */}
                  {session.duration && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Duration:</span> {session.duration} minutes
                      </p>
                    </div>
                  )}

                  {/* Ratings */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Productivity Rating
                      </p>
                      <div className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${getRatingColor(session.rating)}`}>
                        {session.rating}/5
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
                  {session.outletavailability !== null && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <Plug className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          <span className="font-semibold">Outlets:</span>{" "}
                          {session.outletavailability ? (
                            <span className="text-green-700 font-semibold">Available</span>
                          ) : (
                            <span className="text-red-700 font-semibold">Not Available</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  {session.comment && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Comment:</p>
                      <p className="text-sm text-gray-700 italic">{session.comment}</p>
                    </div>
                  )}

                  {/* Collaborators */}
                  {collaboratorNames.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Studied with:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {collaboratorNames.map((name, idx) => (
                          <span
                            key={idx}
                            className="bg-orange-200 text-orange-900 px-3 py-1 rounded-lg text-xs font-semibold"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
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
