import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface DeveloperToolContextType {
  isOpen: boolean
  open: () => void
  close: () => void
}

const DeveloperToolContext = createContext<DeveloperToolContextType | undefined>(undefined)

const STORAGE_KEY = 'lago:devtools:isOpen'

export function DeveloperToolProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const value: DeveloperToolContextType = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved !== null) {
      setIsOpen(saved === 'true')
    }
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, String(isOpen))
    }
  }, [isOpen, isMounted])

  return <DeveloperToolContext.Provider value={value}>{children}</DeveloperToolContext.Provider>
}

export function useDeveloperTool(): DeveloperToolContextType {
  const context = useContext(DeveloperToolContext)

  if (!context) {
    throw new Error('useDeveloperTool must be used within a DeveloperToolProvider')
  }
  return context
}
