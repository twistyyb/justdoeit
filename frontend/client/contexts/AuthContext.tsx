import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    console.log('👤 fetchUserProfile called with userId:', userId)
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5002'
      
      const response = await fetch(`${apiBaseUrl}/user_profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('👤 fetchUserProfile backend response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('👤 No profile found for user (404)')
          return null
        }
        
        const errorData = await response.json()
        console.error('❌ Backend profile fetch failed:', errorData)
        return null
      }
      
      const data = await response.json()
      console.log('✅ User profile fetched successfully via backend:', data)
      return data
      
    } catch (fetchError) {
      console.error('❌ Error calling backend profile endpoint:', fetchError)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    console.log('🚀 AuthContext.signUp called with:', { email, name, password: '***' })
    
    console.log('📡 Calling supabase.auth.signUp...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    console.log('📡 supabase.auth.signUp result:', { 
      hasData: !!data, 
      hasUser: !!data?.user, 
      hasError: !!error,
      errorMessage: error?.message,
      userId: data?.user?.id
    })
    
    if (error) {
      console.error('❌ Supabase auth signup error:', error)
      return { error }
    }
    
    // If signup was successful and we have a user, create their profile
    if (data.user) {
      console.log('👤 User created successfully, creating profile...', { userId: data.user.id })
      
      // Create user profile using backend endpoint
      console.log('👤 Creating user profile via backend endpoint...')
      
      try {
        // Use the backend API URL - adjust this based on your backend setup
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5002'
        const response = await fetch(`${apiBaseUrl}/create_user_profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: data.user.id,
            name: name
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Backend profile creation failed:', errorData)
          return { error: new Error(errorData.detail || 'Failed to create user profile') }
        }
        
        const result = await response.json()
        console.log('✅ User profile created successfully via backend:', result)
        
      } catch (fetchError) {
        console.error('❌ Error calling backend profile endpoint:', fetchError)
        return { error: fetchError }
      }
      
      console.log('✅ User profile created successfully')
    } else {
      console.warn('⚠️ No user data returned from signup')
    }
    
    console.log('🎉 signUp completed successfully')
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
