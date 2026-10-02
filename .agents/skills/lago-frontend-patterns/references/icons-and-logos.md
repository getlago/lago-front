## Icons, logos and brand assets

Brand and provider logos come from two asset sets, and reach the screen through
three rendering patterns. The choice is driven by the surface, not by the brand.

### The two asset sets

| | design-system icon set | brand plates |
| --- | --- | --- |
| Location | `packages/design-system/src/icons/*.svg` | `src/public/images/*.svg` (repo root `src/`) |
| Registered in | `ALL_ICONS` (`packages/design-system/src/components/Icon/mapping.tsx`) | nothing — imported directly |
| Canvas | usually 16×16, mark fills the box | mostly 40×40, mark centred on a solid rounded plate |
| Brand logos present | `google`, `okta` | most integrations: stripe, adyen, netsuite, okta, xero, hubspot… |

`packages/design-system/` also carries its own `public/images/`, holding byte-identical
copies of 18 of those files, served through `publicDir` and exported as
`lago-design-system/images/*`. Nothing imports it today. Adding a plate to that copy
will not make it reachable from the app — use the repo-root `src/public/images/`.

### The three rendering patterns

1. **`<Icon name="…" />`, or a `startIcon` / `endIcon` prop** — 16px glyph, for
   buttons and inline UI.
2. **`<Avatar variant="connector">` + `<Icon />`** — the glyph on a grey rounded
   backdrop. This is what a settings card uses when the brand only has a glyph:
   Google's card in `settings/teamAndSecurity/authentication/Authentication.tsx`
   is one.
3. **`<Avatar variant="connector-full">` + an inline plate import** — the plate
   fills the avatar (`[&>svg]:size-full`). For integration and connector cards.

So a brand does *not* need a plate just because it appears on a card — pattern 2
covers that with the glyph alone. `okta` is the one brand currently in both sets,
because it needs a 16px glyph on the login button and a full-bleed plate on its
connector card.

### Why a plate cannot stand in for a glyph

Plates reserve padding around the mark. In `microsoft-entra-id.svg` the mark spans
10→30 on a 40 viewBox — exactly half the canvas. Shrunk to 16px, as `Login.tsx` does
with `className="mr-2 size-4"`, it paints an 8px mark beside the full-size `google`
and `okta` glyphs next to it. Any plate shrunk into a button loses the same way.

### Adding a provider

- Button or inline → add a 16×16 glyph to `packages/design-system/src/icons/`,
  register it in `ALL_ICONS`, and pass it as `startIcon="<key>"`. Never render it
  as an inline child: `Button` treats `startIcon` as unset and routes its loading
  spinner to the `endIcon` slot, leaving the logo stranded on the left.
- Settings card, glyph is enough → reuse that glyph with
  `<Avatar variant="connector">`. No new asset.
- Connector card needing the full brand plate → add one to `src/public/images/`
  and import it inline into `<Avatar variant="connector-full">`.

A brand that needs both a button glyph and a full plate needs both assets. That
duplication is expected — do not "unify" the sets by pointing one surface at the
other's asset.

Not every file under `src/public/images/` is a brand plate: `psp-icons.svg` is a
composite strip, `flutterwave.svg` has no plate, and `logo/` and `maneki/` are
unrelated artwork.
