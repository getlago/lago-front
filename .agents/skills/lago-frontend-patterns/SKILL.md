---
name: lago-frontend-patterns
description: 'Implementation guidelines for lago-front''s recurring UI patterns and design-system/layout components - an index below pointing to references/<topic>.md, covering both established architecture patterns (drawers, dialogs, forms, pagination, organization-slug scoping) and reactive component-usage gotchas (most components have no entry; a doc exists only where a mistake recurred). TRIGGER - read BEFORE writing or reviewing any UI/component/pattern implementation in this app; check the index for a matching topic before assuming default behavior.'
---

# Frontend patterns & design-system implementation guidelines

The architecture patterns below (drawers, dialogs, forms, pagination,
organization-slug scoping) are always documented in full - they are canonical
guides, not reactive notes. Everything else is documented reactively: most
design-system and layout components have no entry, and that's expected. A doc
exists there only where a mistake recurred enough to be worth codifying, the
same reason `icons-and-logos.md` exists. For anything not listed, follow the
current implementation directly; do not assume a gap in this index means a gap
in behavior.

| Component / topic | Reference |
| --- | --- |
| Dialogs | `references/dialogs.md` |
| Drawers | `references/drawers.md` |
| Icons, logos & brand assets | `references/icons-and-logos.md` |
| ComboBox width & focus/open behavior | `references/combobox-width-and-focus.md` |
| Filters framework internals | `references/filters-framework-internals.md` |
| Selector hover actions | `references/selector-hover-actions.md` |
| Disabled action tooltips | `references/disabled-action-no-tooltip.md` |
| Product filter "all values" encoding | `references/product-filter-all-values.md` |
