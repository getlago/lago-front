import type { FutureConfig } from 'react-router-dom'

// Delete with the v7 bump: v7 has no `future` prop, and the jest mock passes it
// through untyped, so nothing would fail if this were left behind.
export const ROUTER_FUTURE_FLAGS: Partial<FutureConfig> = {
  v7_relativeSplatPath: true,
}
