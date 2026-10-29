# NumericBadge

Reusable count display matching Figma Badge / Numeric. Composes the v2 Badge without changing its defaults.

```tsx
<NumericBadge value={12} />
<NumericBadge value={12} selected />
<NumericBadge value={12} disabled />
```

`value` is a number or string, rendered as supplied. Zero remains visible. Formatting, hiding zero, and abbreviations such as `99+` are caller decisions.

The badge uses `v2-text-number-small` (Inter Regular, 12px/16px, tabular lining figures and slashed zero), 20px height/minimum width, 4px horizontal padding, full radius, and no border or shadow. All states use `selected` background. Default text is `text-muted`, selected text is `text-default`, and disabled text is `disabled-foreground`. Disabled takes precedence over selected. Colors inherit the surrounding theme.

It renders a span and forwards refs, HTML attributes and className. Selected and disabled are visual states, not independent interactions. The parent owns focus, disabled behavior and any live announcements. Use a meaningful accessible label when the surrounding text does not explain the count.

No tone/color prop. Tabs will reuse this badge once Tabs implementation resumes. Preview all states in light and dark at `/design-system/shadcn-badge`.
