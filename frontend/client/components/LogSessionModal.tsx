import { useState } from "react";
import { X, Check } from "lucide-react";
import { LocationSelector } from "./LocationSelector";
import { CollaboratorSelector } from "./CollaboratorSelector";

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogSessionModal({ isOpen, onClose }: LogSessionModalProps) {
  // Get current time
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  // Form state
  const [locationId, setLocationId] = useState<string | null>(null);
  const [inputTime, setInputTime] = useState(getCurrentDateTime());
  const [duration, setDuration] = useState<number>(60);
  const [rating, setRating] = useState<number>(0);
  const [cleanliness, setCleanliness] = useState<number>(3);
  const [comment, setComment] = useState("");
  const [outletAvailability, setOutletAvailability] = useState(true);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationId) {
      alert("Please select a location");
      return;
    }

    setIsSubmitting(true);
    try {
      // dummy endpoint: POST /api/create_sesh
      const payload = {
        locationid: locationId,
        inputTime: new Date(inputTime).toISOString(),
        duration,
        rating,
        cleanliness,
        comment,
        outletAvailability,
        collaborators,
      };

      // const res = await fetch('/api/create_sesh', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
      // const data = await res.json();

      console.log("Session data:", payload);

      setSubmitStatus("success");
      setTimeout(() => {
        onClose();
        setSubmitStatus("idle");
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
          <h2 className="text-3xl font-bold text-gray-900">Log a Session</h2>
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
            />
          </div>

          {/* Date & Time */}
          <div>
            <label htmlFor="inputTime" className="text-sm font-semibold text-gray-700 mb-2 block">
              Date & Time *
            </label>
            <input
              id="inputTime"
              type="datetime-local"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-semibold bg-white"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Duration (minutes) *
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-semibold bg-white"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Productivity Rating (0-5) *
            </label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((value) => (
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
              Cleanliness (0-5) *
            </label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((value) => (
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

          {/* Comment */}
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

          {/* Collaborators */}
          <CollaboratorSelector
            selectedCollaborators={collaborators}
            onCollaboratorsChange={setCollaborators}
          />

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
            disabled={isSubmitting || !locationId}
            className="w-full bg-primary hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg transition-all hover:shadow-xl"
          >
            {isSubmitting ? "Submitting..." : "Log Session"}
          </button>
        </form>
      </div>
    </div>
  );
}
