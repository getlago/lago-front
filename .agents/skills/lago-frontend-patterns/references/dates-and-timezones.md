## Dates and timezones

Decide first whether a field is an instant or a calendar day. An instant (a creation
time, an issuing time, a usage window) belongs to the organization or the customer,
never to the browser. A calendar day from a date-only picker is written and displayed in
UTC, as `loop-spec` pins it. Showing a UTC-midnight day in a negative-offset zone
renders the day before.

- **Display** through `TimezoneDate` (`src/components/TimezoneDate.tsx`). It shows the
  organization timezone by default. For a customer's date pass `mainTimezone="customer"`
  together with `customerTimezone`: `customerTimezone` alone only changes the tooltip.
  For a calendar day pass `mainTimezone="utc0"`. Outside JSX, use
  `intlFormatDateTimeOrgaTZ` from `useOrganizationInfos`.
- **`intlFormatDateTime` defaults to UTC** (`src/core/timezone/utils.ts`). Called without
  a `timezone` option on a value built in another zone, it shifts the date: a
  `23:59` end of month in New York renders as the 1st of the next month.
- **Compute windows** (a usage range, "the last 24 hours", the current period) in the
  timezone the API uses for that resource, not from `DateTime.now()` in the browser's
  zone. When it is unclear which one the API uses, check the resolver or ask on the PR.
- Tests: see `.agents/docs/testing-practices.md`, "Timezone Handling in Tests".
