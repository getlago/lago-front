#!/usr/bin/env node
// DEV ONLY. A fake analytics server for the /analytics-d3set page, so the page works without the
// real one. It answers the routes of the analytics server contract (API.md in the analytics
// server repository) with made-up rows. It reads no database and checks no token: it only
// requires that an `Authorization` header is present, as the real server does.
//
//   node scripts/analytics-mock-server.mjs          # http://localhost:3300
//   PORT=3301 node scripts/analytics-mock-server.mjs
//
// `scripts/analytics-mock/dashboard.json` is the structure of the Superset "Lago Dashboard"
// (tabs, views, charts, filters), in the shape of `GET /api/dashboard`.

import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dashboard = JSON.parse(readFileSync(join(here, 'analytics-mock/dashboard.json'), 'utf8'))
const PORT = Number(process.env.PORT || 3300)
const REFRESH_SECONDS = Number(process.env.REFRESH_SECONDS || 0)
const NOW = new Date(Date.UTC(2026, 9, 1))

// --- Fake values ---------------------------------------------------------------------------------

const VALUES = {
  currency: ['EUR', 'USD', 'GBP'],
  amount_currency: ['EUR', 'USD', 'GBP'],
  customer_country: ['FR', 'US', 'DE', 'GB', 'ES'],
  customer_type: ['company', 'individual'],
  customer_name: ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark Industries'],
  plan_code: ['starter', 'growth', 'scale', 'enterprise'],
  plan_name: ['Starter', 'Growth', 'Scale', 'Enterprise'],
  external_subscription_id: ['sub_001', 'sub_002', 'sub_003', 'sub_004'],
  customer_has_tax_id: ['true', 'false'],
  granularity: ['day', 'week', 'month', 'quarter', 'year'],
  revenue_breakdown: ['Revenue type', 'Currency', 'Plan', 'Customer'],
  mrr_breakdown: ['Type', 'Currency', 'Plan', 'Customer'],
  usage_breakdown: ['Billable metric', 'Currency', 'Plan', 'Customer'],
  billable_metric_code: ['api_calls', 'storage_gb', 'seats'],
  invoice_number: ['INV-0001', 'INV-0002', 'INV-0003'],
  credits_metric: ['Amount', 'Credits'],
  weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  invoice_age: ['Current', '1-30 days', '31-60 days', '61-90 days', '90+ days'],
  payment_timeframe: ['Same day', '1-7 days', '8-14 days', '15-30 days', '30+ days'],
  status: ['Succeeded', 'Failed', 'Pending'],
  payment_status: ['Succeeded', 'Failed', 'Pending'],
  invoice_status: ['Finalized', 'Draft', 'Voided'],
  invoice_type: ['subscription', 'one_off', 'credit', 'progressive_billing'],
  error_code: ['insufficient_funds', 'card_declined', 'expired_card'],
  payment_method_type: ['card', 'sepa_debit', 'bank_transfer'],
  credit_type: ['Purchased credits', 'Offered credits', 'Consumed credits', 'Voided credits'],
  breakdown: ['API calls', 'Storage', 'Seats'],
}

const SERIES_BY_CHART_FIELD = {
  'Revenue streams overview': ['Subscription fee', 'Usage-based fee', 'Commitment fee', 'One-off fee', 'Coupons'],
  'MRR overview': ['New', 'Expansion', 'Contraction', 'Churn'],
}

const NEGATIVE = new Set(['Coupons', 'Contraction', 'Churn', 'Consumed credits', 'Voided credits', 'Credit notes'])

const PIVOT_ROWS = {
  revenue_section_ranked: ['Subscription fee', 'Usage-based fee', 'Commitment fee', 'One-off fee', 'Coupons', 'Credit notes'],
  mrr_section: ['Starting MRR', 'New', 'Expansion', 'Contraction', 'Churn', 'Ending MRR'],
}

// A deterministic random number in [0, 1) for a key.
const rand = (key) => {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  h ^= h >>> 13
  h = Math.imul(h, 0x5bd1e995)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

const iso = (d) => d.toISOString().slice(0, 10)

// The x values of a time chart: from `from` to `to` (inclusive), one per `granularity` step.
const timeline = (params) => {
  const [fromRaw, toRaw] = (params.get('time') || ',').split(',')
  const to = toRaw ? new Date(`${toRaw}T00:00:00Z`) : NOW
  const from = fromRaw
    ? new Date(`${fromRaw}T00:00:00Z`)
    : new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth() + 1, 1))
  const granularity = params.get('granularity') || 'month'
  const out = []
  const d = new Date(from)

  if (granularity === 'month' || granularity === 'quarter' || granularity === 'year') {
    d.setUTCDate(1)
    const months = { month: 1, quarter: 3, year: 12 }[granularity]

    if (granularity === 'quarter') d.setUTCMonth(d.getUTCMonth() - (d.getUTCMonth() % 3))
    if (granularity === 'year') d.setUTCMonth(0)
    while (d <= to && out.length < 400) {
      out.push(iso(d))
      d.setUTCMonth(d.getUTCMonth() + months)
    }
  } else {
    const days = granularity === 'week' ? 7 : 1

    while (d <= to && out.length < 400) {
      out.push(iso(d))
      d.setUTCDate(d.getUTCDate() + days)
    }
  }

  return out
}

// The values of a column, narrowed by the select filter of the same name.
const valuesOf = (field, params, chart) => {
  const own = chart && SERIES_BY_CHART_FIELD[chart.title]
  const usage = chart && /usage|units/i.test(chart.title)
  const breakdown = field === 'breakdown' && !usage ? VALUES.currency : undefined
  const all =
    (field === 'series' && own) || breakdown || PIVOT_ROWS[field] || VALUES[field] || ['A', 'B', 'C']
  const chosen = params.getAll(field)

  return chosen.length ? all.filter((v) => chosen.includes(v)) : all
}

const product = (lists) =>
  lists.reduce((acc, list) => acc.flatMap((a) => list.map((v) => [...a, v])), [[]])

const amount = (key, scale, sign = 1) => sign * Math.round((0.3 + rand(key)) * scale * 100) / 100

const xyRows = (chart, params) => {
  const xs = chart.x.temporal ? timeline(params) : valuesOf(chart.x.key, params, chart)
  const seriesLists = chart.series.map((s) => valuesOf(s, params, chart))
  const rows = []

  xs.forEach((x, i) => {
    for (const combo of product(seriesLists)) {
      const row = { [chart.x.key]: x }

      chart.series.forEach((s, j) => (row[s] = combo[j]))
      for (const m of chart.metrics) {
        const sign = combo.some((v) => NEGATIVE.has(v)) ? -1 : 1
        const growth = chart.x.temporal ? 1 + i / Math.max(1, xs.length) : 1
        const integer = m.format === ',d'

        row[m.key] = integer
          ? Math.round(amount(`${chart.id}${x}${combo}${m.key}`, 120) * growth)
          : Math.round(amount(`${chart.id}${x}${combo}${m.key}`, 18000, sign) * growth * 100) / 100
      }
      rows.push(row)
    }
  })

  return rows
}

const pivotRows = (chart, params) => {
  const columns = chart.pivot.columns.map((c) => (/date|month|period/.test(c) ? timeline(params) : valuesOf(c, params, chart)))
  const rowLists = chart.pivot.rows.map((r) => valuesOf(r, params, chart))
  const rows = []

  for (const rowCombo of product(rowLists)) {
    for (const colCombo of product(columns)) {
      const row = {}

      chart.pivot.rows.forEach((r, i) => (row[r] = rowCombo[i]))
      chart.pivot.columns.forEach((c, i) => (row[c] = colCombo[i]))
      for (const m of chart.metrics) {
        const sign = rowCombo.some((v) => NEGATIVE.has(v)) ? -1 : 1

        row[m.key] = amount(`${chart.id}${rowCombo}${colCombo}${m.key}`, 9000, sign)
      }
      rows.push(row)
    }
  }

  return rows
}

const cell = (key, i) => {
  if (key in VALUES) return VALUES[key][i % VALUES[key].length]
  if (/(_on|_at|date|month)$/.test(key)) return iso(new Date(NOW.getTime() - i * 86400000 * 3))
  if (/amount|balance|paid|recovered|change/.test(key)) return amount(`${key}${i}`, 4000)
  if (/^days|_count$|^count|attempts/.test(key)) return Math.floor(rand(`${key}${i}`) * 90)
  if (/^is_|^has_/.test(key)) return rand(`${key}${i}`) > 0.5
  if (/currency/i.test(key)) return VALUES.currency[i % 3]
  if (/_id$/.test(key)) return `${key.replace(/_id$/, '')}_${String(1000 + i)}`
  if (/number$/.test(key)) return `INV-${String(2000 + i).padStart(6, '0')}`
  if (/name$/.test(key)) return VALUES.customer_name[i % VALUES.customer_name.length]
  if (/email/.test(key)) return `billing+${i}@example.com`

  return `${key} ${i + 1}`
}

const TABLE_TOTAL = 137

const tableRows = (chart, params) => {
  const page = Number(params.get('page') || 0)
  const size = chart.pageSize || 10
  const start = page * size
  const end = Math.min(TABLE_TOTAL, start + size)
  const rows = []

  for (let i = start; i < end; i++) {
    rows.push(Object.fromEntries(chart.columns.map((c) => [c.key, cell(c.key, i)])))
  }

  return { rows, total: TABLE_TOTAL }
}

const message = (chart, params) => {
  if (chart.viz === 'table') return { op: 'replace', ...tableRows(chart, params) }

  const rows = chart.viz === 'pivot' ? pivotRows(chart, params) : xyRows(chart, params)

  return { op: 'replace', rows, total: rows.length }
}

// --- HTTP ----------------------------------------------------------------------------------------

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-lago-organization, last-event-id, accept',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const json = (res, status, body) => {
  res.writeHead(status, { ...cors, 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const auth = req.headers.authorization ? 'auth' : 'no auth'

  console.log(`${req.method} ${url.pathname}${url.search} (${auth}, org ${req.headers['x-lago-organization'] || '-'})`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()

    return
  }
  if (!url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found.' })
  if (!req.headers.authorization) return json(res, 401, { error: 'The request has no token.' })

  if (url.pathname === '/api/dashboard') return json(res, 200, dashboard)

  const options = /^\/api\/filters\/([^/]+)\/options$/.exec(url.pathname)

  if (options) {
    const filter = dashboard.filters.find((f) => f.id === decodeURIComponent(options[1]))

    if (!filter) return json(res, 404, { error: 'No such filter.' })

    return json(res, 200, { values: VALUES[filter.param] || [] })
  }

  const chartRoute = /^\/api\/charts\/([^/]+)\/(rows|events|stream)$/.exec(url.pathname)
  const chart = chartRoute && dashboard.charts[decodeURIComponent(chartRoute[1])]

  if (!chart) return json(res, 404, { error: 'No such chart.' })
  if (chartRoute[2] === 'rows') return json(res, 200, message(chart, url.searchParams))

  res.writeHead(200, {
    ...cors,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  const send = () => res.write(`data: ${JSON.stringify(message(chart, url.searchParams))}\n\n`)

  send()
  const ping = setInterval(() => res.write(': ping\n\n'), 30000)
  const refresh = REFRESH_SECONDS ? setInterval(send, REFRESH_SECONDS * 1000) : undefined

  req.on('close', () => {
    clearInterval(ping)
    clearInterval(refresh)
  })
})

server.listen(PORT, () => {
  console.log(`Analytics mock server (dev only) on http://localhost:${PORT}`)
})
