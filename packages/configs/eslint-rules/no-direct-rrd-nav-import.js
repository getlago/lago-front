/**
 * ESLint rule to forbid importing `useNavigate`, `Link`, and `useLocation`
 * directly from `react-router-dom`. These must be imported from
 * `~/core/router` so the org slug is automatically prepended (for
 * `useNavigate`/`Link`) or so `strippedPathname` is available (for
 * `useLocation`).
 *
 * Exceptions (auth callbacks, Error404, and the wrappers themselves) can
 * opt out with an `// eslint-disable-next-line` comment on the import.
 */

const RESTRICTED = new Set(['useNavigate', 'Link', 'useLocation'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow importing useNavigate, Link, and useLocation from 'react-router-dom'. Use '~/core/router' so the org slug is prepended and strippedPathname is available.",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noDirectImport:
        "Import '{{name}}' from '~/core/router' instead of 'react-router-dom' to ensure the org slug is prepended automatically (useNavigate/Link) or strippedPathname is available (useLocation).",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react-router-dom') return

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue
          const imported = specifier.imported?.name

          if (RESTRICTED.has(imported)) {
            context.report({
              node: specifier,
              messageId: 'noDirectImport',
              data: { name: imported },
            })
          }
        }
      },
    }
  },
}
