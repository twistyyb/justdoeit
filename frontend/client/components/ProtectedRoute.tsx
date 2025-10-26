import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from '@/components/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true)
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">Please sign in to continue</h1>
            <p className="text-white/80">You need to be authenticated to access this page</p>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    )
  }

  return <>{children}</>
}
