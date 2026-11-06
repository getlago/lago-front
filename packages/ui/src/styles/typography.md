# v2 typography

Text styles are CSS classes, not components. Use them on any element in v2 UI; never set font size, line height or weight by hand.

## Classes

| Class | Size / line height | Weight | Use for |
| --- | --- | --- | --- |
| `v2-text-page-title` | 24 / 32 | 600 | Page title (one per page) |
| `v2-text-section-title` | 18 / 24 | 600 | Section heading |
| `v2-text-group-title` | 16 / 24 | 600 | Group or card heading |
| `v2-text-body` | 14 / 20 | 400 | Default text |
| `v2-text-body-large` | 16 / 24 | 400 | Larger body text |
| `v2-text-label` | 14 / 20 | 500 | Controls and short labels (trimmed to the cap height) |
| `v2-text-caption` | 12 / 16 | 400 | Secondary and helper text |
| `v2-text-number-small` | 12 / 16 | 400 | Small figures |
| `v2-text-number` | 14 / 20 | 400 | Figures in text and tables |
| `v2-text-number-large` | 16 / 24 | 400 | Prominent figures |
| `v2-text-code` | 14 / 20 | 400 | Code, IDs, keys (monospace) |

- `v2-emphasis` adds medium weight (500) to any of them.
- Number classes use the numeric font with lining, tabular figures and slashed zero, so amounts align in columns.
- Titles balance their line breaks; body text uses pretty wrapping.
- `a.v2-inline-link` styles an inline link inside v2 text.

## Rules

- Pick by role, not by size: a table amount is `v2-text-number`, not `v2-text-body`.
- Combine a typography class with a color token: `className="v2-text-caption text-text-muted"`.
- `cn()` from `lago-ui/utils` knows that two `v2-text-*` classes conflict and keeps the last one.
- Use a semantic heading element (`h1`, `h2`, …) for titles; the class sets the look, the element sets the structure.

## Fonts

Inter and IBM Plex Mono come from `lago-configs/fonts.css`, which both the app and Storybook import. `lago-ui` never loads fonts itself.

## References

- Storybook: Foundations / Typography
- Source: `typography.css`
