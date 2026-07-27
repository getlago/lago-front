// Sentinel walletId used by the top-up routes to target the customer's
// active wallet before its id is known. Lives outside CreateWalletTopUp so
// shared utils (e.g. regenerateUtils) don't import the whole page tree.
export const CREATE_ACTIVE_WALLET_TOP_UP_ID = 'active-wallet'
