// Debug utility for testing database connection and user_profiles table
import { supabase } from './supabase'

export const debugUserProfilesTable = async () => {
  console.log('🔍 Starting user_profiles table debug...')
  
  try {
    // Test 1: Check if we can access the table
    console.log('📋 Test 1: Checking table access...')
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    console.log('📋 Test 1 result:', {
      hasData: !!testData,
      hasError: !!testError,
      errorMessage: testError?.message,
      errorDetails: testError
    })
    
    if (testError) {
      console.error('❌ Cannot access user_profiles table:', testError)
      return { success: false, error: testError }
    }
    
    // Test 2: Check table structure
    console.log('📋 Test 2: Checking table structure...')
    const { data: structureData, error: structureError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0)
    
    console.log('📋 Test 2 result:', {
      hasData: !!structureData,
      hasError: !!structureError,
      errorMessage: structureError?.message
    })
    
    // Test 3: Try to get current user
    console.log('📋 Test 3: Checking current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('📋 Test 3 result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!userError,
      errorMessage: userError?.message
    })
    
    // Test 4: Try to insert a test record (if user exists)
    if (user) {
      console.log('📋 Test 4: Testing profile creation...')
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: 'Test User',
        })
        .select()
      
      console.log('📋 Test 4 result:', {
        hasData: !!insertData,
        hasError: !!insertError,
        errorMessage: insertError?.message,
        errorDetails: insertError
      })
      
      if (insertError) {
        console.error('❌ Profile creation test failed:', insertError)
        return { success: false, error: insertError }
      }
      
      // Clean up test record
      console.log('🧹 Cleaning up test record...')
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)
    }
    
    console.log('✅ All tests passed!')
    return { success: true }
    
  } catch (error) {
    console.error('💥 Debug test failed with exception:', error)
    return { success: false, error }
  }
}

// Function to test the exact signup flow
export const debugSignupFlow = async (email: string, password: string, name: string) => {
  console.log('🚀 Starting signup flow debug...')
  
  try {
    // Step 1: Sign up user
    console.log('📝 Step 1: Signing up user...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    console.log('📝 Step 1 result:', {
      hasData: !!data,
      hasUser: !!data?.user,
      userId: data?.user?.id,
      hasError: !!error,
      errorMessage: error?.message
    })
    
    if (error) {
      console.error('❌ Signup failed:', error)
      return { success: false, error }
    }
    
    if (!data.user) {
      console.error('❌ No user returned from signup')
      return { success: false, error: new Error('No user returned from signup') }
    }
    
    // Step 2: Wait a bit
    console.log('⏳ Step 2: Waiting for user to be fully created...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Try to create profile via backend endpoint
    console.log('👤 Step 3: Creating user profile via backend...')
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
    
    console.log('👤 Step 3 result:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Backend profile creation failed:', errorData)
      return { success: false, error: new Error(errorData.detail || 'Backend profile creation failed') }
    }
    
    const profileData = await response.json()
    console.log('👤 Profile creation successful:', profileData)
    
    console.log('✅ Signup flow completed successfully!')
    return { success: true, data: { user: data.user, profile: profileData } }
    
  } catch (error) {
    console.error('💥 Signup flow debug failed with exception:', error)
    return { success: false, error }
  }
}

// Function to test the backend endpoint directly
export const debugBackendProfileCreation = async (userId: string, name: string) => {
  console.log('🔧 Testing backend profile creation endpoint...')
  
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5002'
    
    const response = await fetch(`${apiBaseUrl}/create_user_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name: name
      })
    })
    
    console.log('🔧 Backend response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })
    
    const data = await response.json()
    console.log('🔧 Backend response data:', data)
    
    if (!response.ok) {
      console.error('❌ Backend profile creation failed:', data)
      return { success: false, error: data }
    }
    
    console.log('✅ Backend profile creation successful!')
    return { success: true, data }
    
  } catch (error) {
    console.error('💥 Backend profile creation test failed with exception:', error)
    return { success: false, error }
  }
}

// Function to test the backend profile fetch endpoint
export const debugBackendProfileFetch = async (userId: string) => {
  console.log('🔍 Testing backend profile fetch endpoint...')
  
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5002'
    
    const response = await fetch(`${apiBaseUrl}/user_profile/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('🔍 Backend response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('🔍 Profile not found (404) - this is expected for new users')
        return { success: false, error: 'Profile not found', status: 404 }
      }
      
      const errorData = await response.json()
      console.error('❌ Backend profile fetch failed:', errorData)
      return { success: false, error: errorData }
    }
    
    const data = await response.json()
    console.log('✅ Backend profile fetch successful!', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('💥 Backend profile fetch test failed with exception:', error)
    return { success: false, error }
  }
}
