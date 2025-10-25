import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CollaboratorSelectorProps {
  selectedCollaborators: string[];
  onCollaboratorsChange: (collaboratorIds: string[]) => void;
}

export function CollaboratorSelector({
  selectedCollaborators,
  onCollaboratorsChange,
}: CollaboratorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([
    { id: "user-1", name: "Bryan Chen", email: "bryan@example.com" },
    { id: "user-2", name: "Andrew Smith", email: "andrew@example.com" },
    { id: "user-3", name: "Sarah Johnson", email: "sarah@example.com" },
    { id: "user-4", name: "Mike Davis", email: "mike@example.com" },
  ]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // In production, fetch from /api/users
  useEffect(() => {
    // dummy fetch: const res = await fetch('/api/users');
    // const data = await res.json();
    // setAllUsers(data);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(
        (user) =>
          (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !selectedCollaborators.includes(user.id)
      );
      setFilteredUsers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredUsers([]);
      setShowDropdown(false);
    }
  }, [searchQuery, allUsers, selectedCollaborators]);

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
    <div className="mb-6">
      <label className="text-sm font-semibold text-gray-700 mb-2 block">
        Collaborators
      </label>

      {/* Search input */}
      <div className="relative mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowDropdown(true)}
            placeholder="Search collaborators..."
            className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-4 py-3 text-gray-900 bg-white"
          />
        </div>

        {/* Dropdown results */}
        {showDropdown && filteredUsers.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-semibold text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
              </button>
            ))}
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
                <div className="text-xs text-gray-600">{user.email}</div>
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
