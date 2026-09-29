---
name: lago-design-system
description: 'Implementation gotchas for lago-front''s design-system and layout components - an index below pointing to references/<topic>.md for the ones with a documented history of mistakes; most components have no entry yet. TRIGGER - read BEFORE writing or reviewing code touching anything under src/components/designSystem/**, packages/design-system/src/components/**, or src/components/layouts/** (Button, ComboBox, Table, Avatar, Selector, Filters, icons-and-logos, MainHeader, VerticalMenu, and others); check the index for a matching file before assuming default MUI/DS behavior.'
---

# Design system & layout implementation gotchas

Most design-system components have no entry below - that's expected. A doc exists
here only where a mistake recurred enough to be worth codifying, the same reason
`icons-and-logos.md` exists. For anything not listed, follow the current
implementation directly; do not assume a gap in this index means a gap in
behavior.

| Component / topic | Reference |
| --- | --- |
| Icons, logos & brand assets | `references/icons-and-logos.md` |
| ComboBox width & focus/open behavior | `references/combobox-width-and-focus.md` |
| Filters framework internals | `references/filters-framework-internals.md` |
