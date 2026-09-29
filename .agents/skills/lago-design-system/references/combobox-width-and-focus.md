## ComboBox width and focus/open behavior

`ComboBox` (`src/components/form/ComboBox/ComboBox.tsx`) sends its two class props
to different nodes: `containerClassName` → the outer MUI `Autocomplete`,
`className` → the inner input rendered inside it.

- **Full width in a flex row** needs `containerClassName="flex-1"` — the
  `Autocomplete` is the flex child. `className="flex-1"` styles the inner input
  and the field stays narrow. `TextInputField` has no such split, so copying a
  sibling text field's `className` looks right there and wrong on a combobox.
  Reference: the combobox + trash-button row in
  `src/components/taxes/TaxesSelectorSection.tsx`.
- `className` is also the hook for the `*_INPUT_CLASSNAME` selectors in
  `src/core/constants/form.ts` — that's why those are passed as `className`, not
  `containerClassName`.

**Focus + open a combobox revealed by an "+ Add X" button**: use
`scrollToAndClickElement` (`~/core/utils/domUtils`) with a selector targeting the
combobox's input root. The click both focuses the input and drops the option list
open — `openOnFocus` is not needed. Reference:
`src/components/plans/PricingGroupKeys.tsx`. `focusFirstInput`
(`~/components/drawers/useFocusTrap`) only focuses; it never opens.

Tests hitting `scrollToAndClickElement` must stub
`Element.prototype.scrollIntoView = jest.fn()` — jsdom lacks it, and it runs
before the click, so the click silently never happens.
