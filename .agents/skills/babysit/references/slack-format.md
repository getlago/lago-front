# Slack announcement format

Channel `#frontend`, id `C04DJLU0KHD`. Look the id up with `slack_search_channels` if
it ever changes.

The format below is transcribed from the channel's actual posts. Match it. Posts that
follow the house style get read; posts that invent their own get skimmed.

## Base shape

Bold title on line one, `:pr:` and the link on line two.

```
*fix(auth): trim email to prevent whitespace validation failure*
:pr::ladybug: <https://github.com/getlago/lago-front/pull/4019|github.com/getlago/lago-front/pull/4019>
```

The link label drops `https://` while the target keeps it. That is deliberate and it
is what keeps the posts compact.

## Optional lines

**Type emoji** goes immediately after `:pr:`, no space between them. Derive it from
the conventional-commit type in the PR title:

| Title prefix              | Emoji                  |
| ------------------------- | ---------------------- |
| `fix`                     | `:ladybug:`            |
| `test`, `chore`           | `:ninja:`              |
| tooling-flavoured `feat`  | `:hammer_and_wrench:`  |
| `feat`, `refactor`, other | none                   |

When in doubt, no emoji.

**Linear ticket**, own line. Parse the ticket id from the PR body, which the template
seeds with `Fixes LAGO-XXX`. Prefixes in use are `LAGO`, `ING`, `BIL`, `INT`, so match
`[A-Z]+-[0-9]+` rather than hardcoding `LAGO`. Omit the line entirely when there is no
ticket.

```
:admission_tickets: <https://linear.app/getlago/issue/ING-497/slug|linear.app/getlago/issue/ING-497/slug>
```

The body usually carries only the id, not a full URL. `https://linear.app/getlago/issue/<ID>`
resolves without the trailing slug, so build that and use it for both the target and
the scheme-stripped label. When the body already contains a full Linear URL, prefer it
verbatim, slug included.

**Staging preview**, own line. Only when a preview deploy exists for the branch.

```
:link: <https://recurring-rule-form-drawer-app.staging.getlago.com/>
```

## Full example

```
*refactor(multi-connections): port payment & invoicing settings drawers*
:pr: <https://github.com/getlago/lago-front/pull/4003|github.com/getlago/lago-front/pull/4003>
:admission_tickets: <https://linear.app/getlago/issue/ING-497/slug|linear.app/getlago/issue/ING-497/slug>
:link: <https://recurring-rule-form-drawer-app.staging.getlago.com/>
```

## Do not

- Do not append a `Sent using Claude` footer. The Slack integration adds it
  automatically when the message goes through the MCP.
- Do not add a summary paragraph, a findings recap, an emoji header, or a list of what
  babysit fixed. One title, one link, and the optional lines. Nothing else.
- Do not `@here` or `@channel`. Reserved for genuine urgency, which a routine
  announcement is not.

## Detecting a prior announcement

The announcement is babysit's durable state, so the search that finds it has to be
exact.

```
slack_search_public(
  query: '"lago-front/pull/<n>" in:#frontend',
  include_bots: true,
  sort: "timestamp"
)
```

Slack tokenizes, so a search for `pull/402` can return a message about `pull/4020`.
Verify every hit by string-matching the exact URL in the message text and requiring the
character after `/pull/<n>` to be a non-digit or end-of-string. Discard hits that fail
the boundary check.

`include_bots: true` matters. Some PRs are announced by the Lago Code Claude Agent bot
rather than a person, and missing those would cause a duplicate post.

Keep the `ts` of the verified hit. It is the thread anchor for reading replies and for
posting follow-up lines.

## Replying in the thread

```
slack_send_message(channel_id: "C04DJLU0KHD", thread_ts: "<ts>", message: "...")
```

One reply per round, batched across everything handled in that round. Factual, one or
two lines, with the commit sha. Not one reply per comment: the thread has to stay
readable for people who are not babysit.
