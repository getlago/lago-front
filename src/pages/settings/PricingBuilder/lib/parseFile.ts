import * as XLSX from 'xlsx'

const MAX_CHARS = 200_000

export const parseFile = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase()
  let text = ''

  if (name.endsWith('.csv')) {
    text = await file.text()
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    text = await parseExcel(file)
  } else if (name.endsWith('.pdf')) {
    text = await parsePdf(file)
  } else {
    throw new Error(`Unsupported file type: ${file.name}. Use CSV, XLSX or PDF.`)
  }

  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + '\n\n[...truncated]'
  }

  return text
}

const parseExcel = async (file: File): Promise<string> => {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const parts: string[] = []

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    parts.push(`## Sheet: ${sheetName}\n${csv}`)
  }

  return parts.join('\n\n')
}

const parsePdf = async (file: File): Promise<string> => {
  // pdfjs-dist worker setup — use CDN worker to avoid bundler config headaches
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const parts: string[] = []

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((it) => ('str' in it ? it.str : '')).join(' ')
    parts.push(`## Page ${i}\n${text}`)
  }

  return parts.join('\n\n')
}
