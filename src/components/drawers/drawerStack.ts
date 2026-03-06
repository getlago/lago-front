type Listener = () => void

type DrawerStackState = {
  stack: string[]
  listeners: Set<Listener>
}

// Preserve state across HMR updates
const getState = (): DrawerStackState => {
  if (import.meta.hot) {
    if (!import.meta.hot.data.drawerStack) {
      import.meta.hot.data.drawerStack = { stack: [], listeners: new Set<Listener>() }
    }

    return import.meta.hot.data.drawerStack as DrawerStackState
  }

  return { stack: [], listeners: new Set<Listener>() }
}

const state = getState()

const notify = () => {
  state.listeners.forEach((l) => l())
}

const updateBodyScroll = () => {
  document.body.style.overflow = state.stack.length > 0 ? 'hidden' : ''
}

export const drawerStack = {
  push(id: string) {
    if (!state.stack.includes(id)) {
      state.stack = [...state.stack, id]
      updateBodyScroll()
      notify()
    }
  },

  remove(id: string) {
    const index = state.stack.indexOf(id)

    if (index !== -1) {
      state.stack = [...state.stack.slice(0, index), ...state.stack.slice(index + 1)]
      updateBodyScroll()
      notify()
    }
  },

  subscribe(listener: Listener) {
    state.listeners.add(listener)

    return () => {
      state.listeners.delete(listener)
    }
  },

  getSnapshot() {
    return state.stack
  },
}
