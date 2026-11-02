# IconButton

A small composition of the shadcn Button and Tooltip. Import from
`~/components/ui/icon-button`. Use one shared TooltipProvider around the region;
the wrapper deliberately does not create its own provider.

```tsx
<TooltipProvider>
  <IconButton label="Copy invoice number" size="icon-sm" onClick={copyInvoiceNumber}>
    <Copy aria-hidden="true" />
  </IconButton>
</TooltipProvider>
```

`label` is required and supplies both the accessible name and tooltip text.
Use a non-empty, localized action label. Decorative icons must use aria-hidden.
Sizes are icon-sm (32px), icon (36px, default) and icon-lg (40px). Icons retain the
Button's 14px size and stroke width 2. The default variant is ghost; other Button
variants can be selected explicitly.

This v1 renders a native button and forwards its ref, event handlers, form props,
loading and disabled props. It does not support asChild navigation. Loading
preserves the name and geometry. Disabled/loading controls remain native disabled
buttons and are skipped by keyboard navigation. If users need a keyboard-accessible
explanation for a disabled action, compose an explicit focusable tooltip wrapper
at that usage site or show persistent help; this component does not add a second
focus stop around disabled buttons.

The existing production Button, Tooltip and icons are unchanged. Examples live
in `/design-system/shadcn-tooltip` in both themes.
