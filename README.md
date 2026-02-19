# Lago

Lago is an open-source Stripe Billing alternative.

This library will allow you to build an entire billing logic from scratch, even the most complex one. Lago is a real-time event-based library made for usage-based billing, subscription-based billing, and all the nuances of pricing in between.

## Current Releases

| Project        | Release Badge                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Lago**       | [![Lago Release](https://img.shields.io/github/v/release/getlago/lago)](https://github.com/getlago/lago/releases)                   |
| **Lago front** | [![Lago front Release](https://img.shields.io/github/v/release/getlago/lago-front)](https://github.com/getlago/lago-front/releases) |

## Documentation

The official Lago documentation is available here : https://docs.getlago.com

## Contributing

The contribution documentation is available [here](https://github.com/getlago/lago-front/blob/main/CONTRIBUTING.md)

## Front Development Environment

Check the wiki [guide](https://github.com/getlago/lago-front/wiki)

## AI-Assisted Development Skills

This project includes a set of custom skills for AI coding assistants (Claude Code and Cursor) that automate common migration and testing workflows. Skills are invoked via slash commands.

| Skill                          | Command                              | Description                                                                                                                                                                                                |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Make Tests**                 | `/make-tests <pr-number \| branch>`  | Detects modified component files from a PR or branch, adds `data-test` attributes, and creates or migrates tests following project testing conventions.                                                    |
| **Migrate Dialog**             | `/migrate-dialog <path>`             | Migrates a dialog component from the legacy imperative ref-based `Dialog` system (`forwardRef` + `useImperativeHandle`) to the new hook-based NiceModal system (`useFormDialog` / `useCentralizedDialog`). |
| **Migrate Formik to TanStack** | `/migrate-formik-to-tanstack <path>` | Migrates a React form from Formik (`useFormik` + Yup) to TanStack Form (`useAppForm` + Zod), following project conventions.                                                                                |

### Skill files

- **Claude Code**: `.claude/skills/<skill-name>/SKILL.md`
- **Cursor**: `.cursor/rules/<skill-name>.mdc`

## License

Lago is open-source under the GNU Affero General Public License Version 3 (AGPLv3) or any later version.
