import type { QuotePdfHeaderData } from './buildQuotePreviewProps'

/**
 * One-time header rendered at the top of page 1 of a quote / order-form PDF.
 *
 * This is serialized to a static HTML string (via `renderToStaticMarkup`) and
 * injected into the print iframe by `QuotePdfProvider` — it is never mounted in
 * the live app. Styling lives in `richTextEditor.css` under `.quote-pdf-header*`,
 * which `printHtmlContent` mirrors into the iframe. React escapes the
 * backend-sourced text values, so no manual HTML-escaping is needed here.
 */
export const QuotePdfHeader = ({ header }: { header: QuotePdfHeaderData }) => (
  <div className="quote-pdf-header">
    <div className="quote-pdf-header__number">{header.documentNumber}</div>
    {header.rows.map((row) => (
      <div className="quote-pdf-header__row" key={row.label}>
        <span className="quote-pdf-header__label">{row.label}</span>
        <span className="quote-pdf-header__value">{row.value}</span>
      </div>
    ))}
  </div>
)
