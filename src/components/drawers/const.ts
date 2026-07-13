export const CLOSE_DRAWER_PARAMS = { reason: 'close' } as const

// These live here (not in BaseDrawer) so drawer bodies can import them without
// pulling in BaseDrawer's drawerStack dependency chain, which uses import.meta
// and crashes Jest.
export const BASE_DRAWER_CONTENT_TEST_ID = 'base-drawer-content'
// Runtime selector for the scroll container. Kept distinct from the test id,
// which is reserved for integration tests, not production DOM queries.
export const BASE_DRAWER_CONTENT_ATTR = 'data-drawer-content'

export const DRAWER_TRANSITION_DURATION = 300
export const DRAWER_PUSH_BACK_SCALE = 0.96
export const DRAWER_PUSH_BACK_OFFSET = 50
export const DRAWER_BASE_Z_INDEX = 1600
