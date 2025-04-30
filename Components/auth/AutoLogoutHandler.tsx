'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { handleLogout } from "../../utils/auth/logout"

export const AutoLogoutHandler = () => {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) return

    // Handle user inactivity
    let inactivityTimer: NodeJS.Timeout

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        handleLogout()
      }, 2 * 60 * 60 * 1000) // 2 hours
    }

    const handleUserActivity = () => {
      resetInactivityTimer()
    }

    // Add event listeners
    document.addEventListener('mousemove', handleUserActivity)
    document.addEventListener('keypress', handleUserActivity)

    // Initial timer
    resetInactivityTimer()

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer)
      document.removeEventListener('mousemove', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [session])

  return null
}