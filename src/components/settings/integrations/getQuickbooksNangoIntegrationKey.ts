// QuickBooks sandbox and production companies live in two Nango integrations.
export const getQuickbooksNangoIntegrationKey = (sandbox?: boolean | null): string =>
  sandbox ? 'quickbooks-sandbox' : 'quickbooks'
