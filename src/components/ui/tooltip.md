# Shadcn Tooltip

Import from `~/components/ui/tooltip`. This is independent of the legacy
`components/designSystem/Tooltip`; production consumers are not migrated.

Mount one `TooltipProvider` around the toolbar or shadcn region, not around each
button. The first pointer hover waits 300ms. After an open tooltip closes, another
trigger in the same provider opens instantly within 500ms; afterward the initial
delay returns. Keyboard focus opens immediately. Avoid overriding timings on
individual tooltips.

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" aria-label="Copy invoice number">
        <Copy aria-hidden="true" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Copy invoice number</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Keep content brief and non-interactive. The button still needs its own accessible
name. Escape, blur and activation dismiss the tooltip; pointer travel into the
content keeps it open. Essential help must remain available without hover.
Native disabled buttons cannot receive focus: use an explicit focusable wrapper
when an explanation is needed, rather than altering disabled button behavior.

Content uses inverse/inverse-foreground, caption, px-2 py-1, rounded-md and the
floating shadow. It hugs short text, wraps at a maximum outer width of 240px,
shrinks to the available viewport width and stays left aligned. Top/center is
the default placement with an 8px offset; collisions can flip or shift it.
No arrow or opening animation is included in v1. ColorThemePortal preserves the
surrounding theme when content is rendered outside the local DOM subtree.

Preview: `/design-system/shadcn-tooltip`. The IconButton wrapper is a separate
follow-up; this version composes the existing shadcn Button directly.
