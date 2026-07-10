export const CLOSE_DRAWER_PARAMS = { reason: 'close' } as const

// Lives here (not in BaseDrawer) so drawer bodies can target the scroll
// container without importing BaseDrawer's drawerStack dependency chain,
// which uses import.meta and crashes Jest.
export const BASE_DRAWER_CONTENT_TEST_ID = 'base-drawer-content'

export const DRAWER_TRANSITION_DURATION = 300
export const DRAWER_PUSH_BACK_SCALE = 0.96
export const DRAWER_PUSH_BACK_OFFSET = 50
export const DRAWER_BASE_Z_INDEX = 1600
