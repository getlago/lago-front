import { Typography as MuiTypography, TypographyProps as MuiTypographyProps } from '@mui/material'
import { ElementType, memo } from 'react'
import clsns from 'classnames'
import sanitizeHtml from 'sanitize-html'
import { Link } from 'react-router-dom'
import _isEqual from 'lodash/isEqual'
import styled, { css } from 'styled-components'

const defaultSanitizerOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'sup', 'span'],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'data-*'],
    '*': ['class'],
  },
  selfClosing: ['br', 'hr'],
}

const sanitize = (dirty: string, options: sanitizeHtml.IOptions | undefined) => ({
  __html: sanitizeHtml(dirty, { ...defaultSanitizerOptions, ...options }),
})

type Color = MuiTypographyProps['color'] | 'disabled' | 'contrast'
interface TypographyProps extends Omit<MuiTypographyProps, 'color'> {
  className?: string
  component?: ElementType
  color?: Color
  html?: string
}

const ADDITIONNAL_COLORS = ['disabled', 'contrast']

const mapColor = (
  variant: TypographyProps['variant'],
  color: Color
): MuiTypographyProps['color'] => {
  if (color) {
    return ADDITIONNAL_COLORS.includes(color as string)
      ? 'inherit'
      : (color as MuiTypographyProps['color'])
  }

  switch (variant) {
    case 'headline':
    case 'subhead':
      return 'textSecondary'
    case 'bodyHl':
    case 'body':
    case 'captionHl':
    case 'note':
    case 'caption':
    default:
      return 'textPrimary'
  }
}

export const Typography = memo(
  ({
    variant = 'body',
    className,
    color,
    children,
    html,
    component = 'div',
    noWrap,
    ...props
  }: TypographyProps) => {
    const getSanitizedHtml = (htmlString: string) => {
      const internalLinks: sanitizeHtml.Attributes[] = []
      const sanitizeOptions: sanitizeHtml.IOptions = {
        transformTags: {
          a: (tagName, attribs) => {
            /**
             * If there is a `data-text` attribute, we consider the link as internal
             * We have to use `data-text` in this case as we can't get the original `text` from transformTags
             */
            if (!!attribs['data-text']) {
              internalLinks.push(attribs)

              return {
                text: '{{link}}', // This will be replaced later by the <Link /> component
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any
            }
            // For external links, don't change anything
            return { tagName, attribs }
          },
        },
      }
      const sanitized = sanitize(htmlString, sanitizeOptions)

      // If there's no internal link, simply return the sanitized string
      if (!internalLinks.length) return <span dangerouslySetInnerHTML={sanitized} />

      // Otherwise, replace all the {{link}} by the <Link /> component
      const splitted = sanitized.__html.split('{{link}}')
      let sanitizedWithInternalLinks: JSX.Element[] = []

      // Add each string + the links in between
      splitted.forEach((string, i) => {
        const internalLink = i > 0 ? internalLinks[i - 1] : null

        if (internalLink) {
          sanitizedWithInternalLinks.push(
            <Link key={`link-${i}`} to={internalLink.href}>
              {internalLink['data-text']}
            </Link>
          )
        }

        sanitizedWithInternalLinks.push(
          <span key={i} dangerouslySetInnerHTML={{ __html: string }} />
        )
      })

      return sanitizedWithInternalLinks.map((child) => child)
    }

    return (
      <StyledMuiTypography
        variant={variant}
        color={mapColor(variant, color)}
        className={clsns(className, {
          [`MuiTypography-additionalColor-${color}`]:
            color && ADDITIONNAL_COLORS.includes(color as string),
        })}
        data-qa={variant}
        variantMapping={{
          subhead: 'div',
          caption: 'div',
          note: 'div',
          captionCode: 'code',
        }}
        $code={variant === 'captionCode'}
        $noWrap={noWrap}
        noWrap={noWrap}
        component={component}
        {...props}
      >
        {html ? getSanitizedHtml(html) : children}
      </StyledMuiTypography>
    )
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ component, ...prevProps }, { component: nextComponent, ...nextProps }) =>
    _isEqual(prevProps, nextProps)
)

Typography.displayName = 'Typography'

const StyledMuiTypography = styled(MuiTypography)<{
  component?: unknown
  $code?: boolean
  $noWrap?: boolean
}>`
  ${({ $noWrap, $code }) =>
    !$noWrap &&
    css`
      white-space: ${$code ? 'pre' : 'pre-line'};
    `}
`
