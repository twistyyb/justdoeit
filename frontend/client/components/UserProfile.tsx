import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export const UserProfile: React.FC = () => {
  const { user, userProfile, signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully",
      })
    }
  }

  if (!user) return null

  const displayName = userProfile?.name || user.email || 'User'
  const avatarLetter = userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="group flex items-center bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-full py-2 transition-all duration-300 ease-in-out overflow-hidden">
      <div className="flex items-center gap-2 px-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {avatarLetter}
          </span>
        </div>
        <span className="text-white text-sm font-medium">
          {displayName}
        </span>
      </div>
      <div className="w-0 group-hover:w-auto transition-all duration-300 ease-in-out overflow-hidden">
        <div className="px-3">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
