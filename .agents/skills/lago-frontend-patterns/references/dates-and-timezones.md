## Dates and timezones

Billing dates belong to the organization or the customer, never to the browser. A date
computed in the browser's zone is off by a day for anyone in a different one.

- **Display** through `TimezoneDate` (`src/components/TimezoneDate.tsx`, organization
  timezone by default, `customerTimezone` when the date belongs to a customer) or
  `intlFormatDateTimeOrgaTZ` from `useOrganizationInfos`.
- **`intlFormatDateTime` defaults to UTC** (`src/core/timezone/utils.ts`). Called without
  a `timezone` option on a value built in another zone, it shifts the date: a
  `23:59` end of month in New York renders as the 1st of the next month.
- **Compute windows** (a usage range, "the last 24 hours", the current period) in the
  timezone the API uses for that resource, not from `DateTime.now()` in the browser's
  zone. When it is unclear which one the API uses, check the resolver or ask on the PR.
- Tests: see `.agents/docs/testing-practices.md`, "Timezone Handling in Tests", and run
  date logic once under a negative-offset zone (`TZ=America/New_York`).
