import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

const specimens = [
  ['v2-text-page-title', 'Page title'],
  ['v2-text-section-title', 'Section title'],
  ['v2-text-group-title', 'Group title'],
  ['v2-text-body', 'Body'],
  ['v2-text-body-large', 'Body large'],
  ['v2-text-label', 'Label'],
  ['v2-text-caption', 'Caption'],
  ['v2-text-number-small', '1,234.00 · 00:18:09'],
  ['v2-text-number', '1,234.00 · 00:18:09'],
  ['v2-text-number-large', '1,234.00 · 00:18:09'],
  ['v2-text-code', 'api_key_0011_24f8c6'],
]

export const TypographyTest = (): JSX.Element => (
  <section className="mb-12 flex flex-col gap-6" aria-label="V2 typography">
    <h2 className="v2-text-section-title">Typography</h2>
    <div className="flex flex-col gap-4">
      {specimens.map(([className, sample]) => (
        <div key={className} className="flex flex-wrap items-baseline gap-4">
          <code className="v2-text-caption w-56">{className}</code>
          <span className={className}>{sample}</span>
        </div>
      ))}
    </div>
    <p className="v2-text-body">
      Your invoice is <strong className="v2-emphasis">due tomorrow</strong>.{' '}
      <a className="v2-inline-link" href="#v2-numeric-example">
        Review the amounts
      </a>
      .
    </p>
    <p className="v2-text-body max-w-xs">
      Explanatory content wraps naturally, including when this panel becomes narrow or text is
      enlarged.
    </p>
    <code className="v2-text-code max-w-xs [overflow-wrap:anywhere]">
      api_key_0011_abcdefghijklmnopqrstuvwxyz_0123456789
    </code>
    <details className="max-w-xs">
      <summary className="v2-text-body cursor-pointer">
        <span className="block truncate">
          A long invoice description that needs more room to display in full
        </span>
      </summary>
      <p className="v2-text-body">
        A long invoice description that needs more room to display in full
      </p>
    </details>
    <table id="v2-numeric-example" className="max-w-sm">
      <caption className="v2-text-label text-left">Comparable amounts</caption>
      <thead>
        <tr>
          <th className="v2-text-label text-left" scope="col">
            Invoice
          </th>
          <th className="v2-text-label text-right" scope="col">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {[1111, 8888, 0].map((amount, index) => (
          <tr key={amount}>
            <td className="v2-text-body">Invoice {index + 1}</td>
            <td className="v2-text-number text-right">
              {intlFormatNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="flex max-w-sm flex-col gap-4">
      <label className="v2-text-label" htmlFor="v2-number-input">
        Numeric override
      </label>
      <Input id="v2-number-input" className="v2-text-number" defaultValue="1234.00" />
      <label className="v2-text-label" htmlFor="v2-file-input">
        File input
      </label>
      <Input id="v2-file-input" type="file" />
      <Button asChild variant="link">
        <a href="#v2-numeric-example">Review amounts</a>
      </Button>
    </div>
  </section>
)
