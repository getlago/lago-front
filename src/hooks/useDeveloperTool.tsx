import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCurrentUser } from '~/hooks/useCurrentUser'

const DeveloperToolContext = createContext<DeveloperToolContextType | undefined>(undefined)

export const DEVTOOL_STORAGE_KEY = 'devtoolIsOpen'
export const DEVTOOL_TAB_PARAMS = 'devtool-tab'

export interface DeveloperToolContextType {
  isOpen: boolean
  open: () => void
  close: () => void
}

export function DeveloperToolProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DeveloperToolContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </DeveloperToolContext.Provider>
  )
}

export function useDeveloperTool(): DeveloperToolContextType {
  const context = useContext(DeveloperToolContext)
  const { currentUser } = useCurrentUser()
  const navigate = useNavigate()
  const [isMounted, setIsMounted] = useState(false)

  const lsItem = localStorage.getItem(DEVTOOL_STORAGE_KEY)

  // We can copy/paste the URL of the devtools in the browser and it will open the devtools with the correct tab
  const checkParamsFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const devtoolTab = params.get(DEVTOOL_TAB_PARAMS) ?? ''
    const decodedDevtoolTab = decodeURIComponent(devtoolTab)

    const isValidUser = !!currentUser

    if (decodedDevtoolTab && isValidUser) {
      navigate(decodedDevtoolTab)
      context?.open()
    }

    // Remove the params from the URL
    params.delete(DEVTOOL_TAB_PARAMS)
    const url = `${window.location.pathname}`

    window.history.replaceState({}, '', url)
  }

  // If we have previously opened the devtools, we open it again in the same tab
  const checkLocalStorage = () => {
    if (lsItem !== null) {
      lsItem === 'true' && context?.open()
    }
  }

  // On mounted, check the params from the URL and the local storage
  useEffect(() => {
    checkParamsFromUrl()
    checkLocalStorage()

    setIsMounted(true)
  }, [])

  // After the component is mounted, save the state of the devtools in the local storage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(DEVTOOL_STORAGE_KEY, String(context?.isOpen))
    }
  }, [context?.isOpen, isMounted])

  // After the component is mounted, close the devtools if the local storage is empty
  useEffect(() => {
    if (isMounted) {
      lsItem === null && context?.close()
    }
  }, [context, isMounted, lsItem])

  // Throw an error if the hook is used outside of the provider
  if (!context) {
    throw new Error('useDeveloperTool must be used within a DeveloperToolProvider')
  }

  return context
}
