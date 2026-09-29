## Disabled action tooltips

When a row or menu action is unavailable because of entity state (a plan
attached to contracts, a contract not in the right status, etc.), render it
**disabled with no tooltip**. Do not add "why it's disabled" tooltip copy, even
if a sibling component happens to have one - `useCatalogPlanTableActions.tsx`'s
catalog-plan-delete tooltip predates this being settled as the pattern; it's the
exception, not a precedent to copy.

**How to apply:** permission missing → hide the action entirely. State-locked →
`disabled: true` only, nothing else. Don't add a translation key for
disabled-reason copy.
