import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth()
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

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-full px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-white text-sm font-medium">
          {user.email}
        </span>
      </div>
      <Button
        onClick={handleSignOut}
        variant="ghost"
        size="sm"
        className="text-white/80 hover:text-white hover:bg-white/10"
      >
        Sign Out
      </Button>
    </div>
  )
}
