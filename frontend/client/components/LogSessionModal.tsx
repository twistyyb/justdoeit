import { useState } from "react";
import { X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { LocationSelector } from "./LocationSelector";
import { CollaboratorSelector } from "./CollaboratorSelector";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Location, User } from "../../shared/api";

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preloadedLocations?: Location[];
  preloadedUsers?: User[];
  onLocationCreated?: (newLocation: Location) => void;
}

export function LogSessionModal({ 
  isOpen, 
  onClose, 
  preloadedLocations = [], 
  preloadedUsers = [], 
  onLocationCreated 
}: LogSessionModalProps) {
  const { user, userProfile } = useAuth();
  
  // Get current time in Pacific Time
  const getCurrentDateTime = () => {
    const now = new Date();
    // Convert to Pacific Time
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = pacificTime.getFullYear();
    const month = String(pacificTime.getMonth() + 1).padStart(2, '0');
    const day = String(pacificTime.getDate()).padStart(2, '0');
    const hours = String(pacificTime.getHours()).padStart(2, '0');
    const minutes = String(pacificTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // No longer need internal preloading state - data comes from props

  // Form state
  const [locationId, setLocationId] = useState<string | null>(null);
  const [inputTime, setInputTime] = useState(getCurrentDateTime());
  const [duration, setDuration] = useState<string>("60");
  const [rating, setRating] = useState<number>(3); // Default to 3 (backend requires 1-5)
  const [cleanliness, setCleanliness] = useState<number>(3);
  const [crowdedness, setCrowdedness] = useState<number>(3);
  const [comment, setComment] = useState("");
  const [outletAvailability, setOutletAvailability] = useState(true);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Handle new location creation to keep preloaded data fresh
  const handleLocationCreated = (newLocation: Location) => {
    if (onLocationCreated) {
      onLocationCreated(newLocation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please sign in to log a session");
      return;
    }

    if (!locationId) {
      alert("Please select a location");
      return;
    }

    // Validate rating (backend requires 1-5)
    if (rating < 1 || rating > 5) {
      alert("Please select a productivity rating (1-5)");
      return;
    }

    // Validate cleanliness (backend requires 1-5)
    if (cleanliness < 1 || cleanliness > 5) {
      alert("Please select a cleanliness rating (1-5)");
      return;
    }

    // Validate crowdedness (backend requires 1-5)
    if (crowdedness < 1 || crowdedness > 5) {
      alert("Please select a crowdedness rating (1-5)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload matching backend format
      // POST http://127.0.0.1:5002/create_session
      
      // Include current user in creators array along with selected collaborators
      const allCreators = user ? [user.id, ...collaborators] : collaborators;
      
      console.log("Current user ID:", user?.id);
      console.log("Selected collaborators:", collaborators);
      console.log("All creators (current user + collaborators):", allCreators);
      
      // Use current datetime if no custom time is set (when advanced options are hidden)
      const sessionTime = showAdvancedOptions ? inputTime : getCurrentDateTime();
      
      // Convert the datetime-local input to Pacific Time ISO string
      // Since we're always using Pacific Time, treat the input as Pacific Time
      const pacificISOString = (() => {
        // Parse the datetime-local input (YYYY-MM-DDTHH:MM format)
        const [datePart, timePart] = sessionTime.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Create a date string in Pacific Time format
        const pacificDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        
        // Create a date object and convert to Pacific Time
        const tempDate = new Date(pacificDateString);
        const pacificTime = new Date(tempDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        
        return pacificTime.toISOString();
      })();
      
      // Log the input time in PST and the exact time being sent to Supabase
      console.log("Input time (PST):", sessionTime);
      console.log("Exact time sent to Supabase:", pacificISOString);
      
      const payload = {
        creators: allCreators, // Current user + selected collaborators (all UUIDs)
        locationid: locationId,  // uuid from dropdown
        inputtime: pacificISOString, // Pacific Time in ISO format
        duration: parseInt(duration) || 0,  // int (mins), convert string to number
        rating,                  // double (1-5)
        cleanliness,            // int (1-5)
        crowdedness,            // int (1-5)
        comment,                // str
        outletavailability: outletAvailability, // IMPORTANT: lowercase to match backend!
      };

      console.log("Sending session data to backend:", payload);
      
      // Call backend API
      const response = await apiClient.createSession(payload);
      
      console.log("Backend response:", response);

      setSubmitStatus("success");
      setTimeout(() => {
        onClose();
        setSubmitStatus("idle");
        // Reset form
        setLocationId(null);
        setInputTime(getCurrentDateTime());
        setDuration("60");
        setRating(3); // Reset to valid default (1-5 range)
        setCleanliness(3);
        setCrowdedness(3);
        setComment("");
        setOutletAvailability(true);
        setCollaborators([]);
        setShowAdvancedOptions(false);
      }, 1500);
    } catch (error) {
      console.error("Error submitting session:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 flex justify-between items-center p-6 rounded-t-3xl">
          <h2 className="text-3xl font-bold text-gray-900">
            {userProfile?.name || user?.email || "User"}'s New Session
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Location */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Location *
            </label>
            <LocationSelector
              selectedLocation={locationId}
              onLocationSelect={setLocationId}
              preloadedLocations={preloadedLocations}
              onLocationCreated={handleLocationCreated}
            />
          </div>

          {/* Collaborators */}
          <CollaboratorSelector
            selectedCollaborators={collaborators}
            onCollaboratorsChange={setCollaborators}
            preloadedUsers={preloadedUsers}
          />


          {/* Duration */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Duration (minutes) *
            </label>
            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={(e) => {
                // On blur, ensure we have a valid number
                const val = e.target.value;
                if (val === "" || parseInt(val) < 0) {
                  setDuration("0");
                }
              }}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-semibold bg-white"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Productivity Rating (1-5) *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`w-12 h-12 rounded-lg font-bold text-sm transition-all border-2 ${
                    rating === value
                      ? "bg-orange-400 border-orange-500 text-white shadow-lg"
                      : "bg-gray-100 border-gray-300 text-gray-900 hover:border-orange-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Cleanliness (1-5) *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCleanliness(value)}
                  className={`w-12 h-12 rounded-lg font-bold text-sm transition-all border-2 ${
                    cleanliness === value
                      ? "bg-orange-400 border-orange-500 text-white shadow-lg"
                      : "bg-gray-100 border-gray-300 text-gray-900 hover:border-orange-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Crowdedness */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Crowdedness (1-5) *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCrowdedness(value)}
                  className={`w-12 h-12 rounded-lg font-bold text-sm transition-all border-2 ${
                    crowdedness === value
                      ? "bg-orange-400 border-orange-500 text-white shadow-lg"
                      : "bg-gray-100 border-gray-300 text-gray-900 hover:border-orange-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              1 = Very quiet, 5 = Very crowded
            </p>
          </div>

          {/* Outlet Availability */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Outlets Available *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setOutletAvailability(true)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all border-2 ${
                  outletAvailability
                    ? "bg-green-100 border-green-400 text-green-900"
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                ✓ Yes
              </button>
              <button
                type="button"
                onClick={() => setOutletAvailability(false)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all border-2 ${
                  !outletAvailability
                    ? "bg-red-100 border-red-400 text-red-900"
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                ✗ No
              </button>
            </div>
          </div>


          {/* Advanced Options Toggle */}
          <div className="border-t border-gray-200 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center justify-center gap-2 w-full py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-xs font-medium">More Options</span>
              {showAdvancedOptions ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Advanced Options - Date & Time & Comments */}
          {showAdvancedOptions && (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div>
                <label htmlFor="inputTime" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Custom Date & Time (Optional)
                </label>
                <input
                  id="inputTime"
                  type="datetime-local"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-semibold bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave this as default to use current time, or set a custom time for backlogging sessions. All times are in Pacific Time.
                </p>
              </div>

              {/* Comments */}
              <div>
                <label htmlFor="comment" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Comments
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any notes about this study session..."
                  rows={4}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* Submit Status */}
          {submitStatus === "success" && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-600" />
              <span className="text-green-900 font-semibold">
                Session logged successfully!
              </span>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
              <span className="text-red-900 font-semibold">
                Error submitting session. Please try again.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !locationId || !user}
            className="w-full bg-primary hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg transition-all hover:shadow-xl"
          >
            {isSubmitting ? "Submitting..." : "Log Session"}
          </button>
        </form>
      </div>
    </div>
  );
}
