/**
 * CollaboratorSelector Component
 * 
 * Allows users to search and select collaborators for study sessions.
 * Fetches real users from the backend API.
 */

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { User } from "../../shared/api";
import { useAuth } from "@/contexts/AuthContext";

interface CollaboratorSelectorProps {
  selectedCollaborators: string[];
  onCollaboratorsChange: (collaboratorIds: string[]) => void;
  preloadedUsers?: User[];
}

export function CollaboratorSelector({
  selectedCollaborators,
  onCollaboratorsChange,
  preloadedUsers,
}: CollaboratorSelectorProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use preloaded users or fetch from backend
  useEffect(() => {
    if (preloadedUsers && preloadedUsers.length > 0) {
      // Use preloaded data
      console.log("Using preloaded users:", preloadedUsers);
      setAllUsers(preloadedUsers);
      setIsLoading(false);
      setError(null);
    } else {
      // Fetch users from backend: GET http://127.0.0.1:5002/users
      const fetchUsers = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const users = await apiClient.getUsers();
          console.log("Fetched users:", users);
          setAllUsers(users);
        } catch (err) {
          console.error("Error fetching users:", err);
          setError("Failed to load users");
          // Fallback to empty array
          setAllUsers([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUsers();
    }
  }, [preloadedUsers]);

  useEffect(() => {
    // Filter out current user and already selected collaborators
    const availableUsers = allUsers.filter(
      (u) => u.id !== user?.id && !selectedCollaborators.includes(u.id)
    );

    if (searchQuery.trim()) {
      // Filter by search query
      const filtered = availableUsers.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
      // Only show dropdown if it's already open (user has focused the input)
      if (showDropdown) {
        setShowDropdown(true);
      }
    } else {
      // Show all available users when search is empty (limit to 10 for visual purposes)
      setFilteredUsers(availableUsers.slice(0, 10));
      // Don't automatically show dropdown - only when user focuses input
    }
  }, [searchQuery, allUsers, selectedCollaborators, user?.id, showDropdown]);

  // Initialize filtered users when component loads
  useEffect(() => {
    if (allUsers.length > 0) {
      const availableUsers = allUsers.filter(
        (u) => u.id !== user?.id && !selectedCollaborators.includes(u.id)
      );
      setFilteredUsers(availableUsers.slice(0, 10));
    }
  }, [allUsers, user?.id, selectedCollaborators]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectUser = (userId: string) => {
    onCollaboratorsChange([...selectedCollaborators, userId]);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveUser = (userId: string) => {
    onCollaboratorsChange(
      selectedCollaborators.filter((id) => id !== userId)
    );
  };

  const selectedUserDetails = allUsers.filter((user) =>
    selectedCollaborators.includes(user.id)
  );

  return (
    <div className="mb-6" ref={dropdownRef}>
      <label className="text-sm font-semibold text-gray-700 mb-2 block">
        Collaborators
      </label>

      {error && (
        <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* Search input */}
      <div className="relative mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setShowDropdown(true);
              // Ensure we have the latest filtered users when focusing
              const availableUsers = allUsers.filter(
                (u) => u.id !== user?.id && !selectedCollaborators.includes(u.id)
              );
              if (!searchQuery.trim()) {
                setFilteredUsers(availableUsers.slice(0, 10));
              }
            }}
            placeholder={isLoading ? "Loading users..." : "Search collaborators or click to see all..."}
            disabled={isLoading}
            className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-4 py-3 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Dropdown results */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-900">{user.name}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                {searchQuery.trim() ? "No users found matching your search" : "No other users available"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected collaborators */}
      {selectedUserDetails.length > 0 && (
        <div className="space-y-2">
          {selectedUserDetails.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between bg-orange-50 border-2 border-orange-200 rounded-lg px-4 py-2"
            >
              <div>
                <div className="font-semibold text-gray-900">{user.name}</div>
              </div>
              <button
                onClick={() => handleRemoveUser(user.id)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
