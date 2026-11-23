# MainHeader

`MainHeader.Configure` pushes its props to the header only when their snapshot changes.
`configSnapshot` (`src/components/MainHeader/MainHeaderConfigure.tsx`) serializes the
config with functions, tab `content`, `filtersSection` and React nodes stripped. A new
callback alone is not a change.

**Callbacks that close over query data go stale.** An `actions` item whose `onClick`
opens an edit dialog seeded with the entity keeps the entity from the render that last
changed the snapshot. Edit a field the header does not display (a list, a nested
object), save, reopen: the dialog shows the old values, and saving again overwrites the
edit. Set a top-level `snapshotKey` that changes with everything the callbacks read:
`snapshotKey={JSON.stringify(data)}` (`AppliedRateCardDetailsView.tsx`), or a composite
string of the fields used (`ContractDetails.tsx`). Tab `content` follows the same rule:
`useCustomerDetailsHeaderTabs.tsx`.

**Test it through a stable host.** Rerendering with a different root element remounts
the page and hides the bug. Render one host component, change its query data, rerender
the same host, then trigger the header action and assert it receives the new data.
