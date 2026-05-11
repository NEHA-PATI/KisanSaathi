import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authChecked, setAuthChecked] = useState(true)
  const [isLoadingAuth, setIsLoadingAuth] = useState(false)
  const [authError, setAuthError] = useState(null)

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(false)
    setAuthChecked(true)
    setAuthError(null)
    return true
  }, [])

  const navigateToLogin = useCallback(() => {
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: true,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authChecked,
      authError,
      checkUserAuth,
      navigateToLogin,
    }),
    [authChecked, authError, checkUserAuth, isLoadingAuth, navigateToLogin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
