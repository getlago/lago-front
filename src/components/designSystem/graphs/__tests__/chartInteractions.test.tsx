import { act, render, screen } from '@testing-library/react'
import { Settings } from 'luxon'
import { ComponentProps, ReactElement } from 'react'
import { Bar, BarChart, LineChart, AreaChart as RechartAreaChart, Tooltip } from 'recharts'

import {
  AnalyticsStateProvider,
  useAnalyticsState,
} from '~/components/analytics/AnalyticsStateContext'
import { CurrencyEnum, TimeGranularityEnum } from '~/generated/graphql'

import AreaChart from '../AreaChart'
import { multipleStackedBarChartLoadingFakeBars } from '../fixtures'
import MultipleLineChart from '../MultipleLineChart'
import StackedBarChart, { StackedBarChartBar } from '../StackedBarChart'

jest.mock('recharts', () => ({
  Area: () => null,
  AreaChart: jest.fn(),
  Bar: jest.fn(() => null),
  BarChart: jest.fn(),
  Customized: () => null,
  Line: () => null,
  LineChart: jest.fn(),
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: ComponentProps<typeof BarChart>) => children,
  Tooltip: (props: ComponentProps<typeof Tooltip>) => mockTooltip(props),
  XAxis: () => null,
  YAxis: () => null,
}))

const mockTooltip = jest.fn<ReactElement | null, [ComponentProps<typeof Tooltip>]>(() => null)

const data = [
  {
    startOfPeriodDt: '2024-01-01',
    endOfPeriodDt: '2024-01-31',
    first: 100,
    second: 200,
    third: 300,
  },
  {
    startOfPeriodDt: '2024-02-01',
    endOfPeriodDt: '2024-02-29',
    first: 400,
    second: 500,
    third: 600,
  },
]

const bars: StackedBarChartBar<(typeof data)[number]>[] = [
  { dataKey: 'first', tooltipLabel: 'First', colorHex: '#111', barIndex: 3, tooltipIndex: 2 },
  { dataKey: 'second', tooltipLabel: 'Second', colorHex: '#222', barIndex: 1, tooltipIndex: 3 },
  { dataKey: 'third', tooltipLabel: 'Third', colorHex: '#333', barIndex: 2, tooltipIndex: 1 },
]

const chartProps = {
  currency: CurrencyEnum.Usd,
  data,
  loading: false,
  xAxisDataKey: 'startOfPeriodDt',
  timeGranularity: TimeGranularityEnum.Monthly,
} satisfies Omit<ComponentProps<typeof StackedBarChart<(typeof data)[number]>>, 'bars'>

const StateProbe = (): ReactElement => {
  const { hoverDataIndex, clickedDataIndex, handleMouseLeave } = useAnalyticsState()

  return (
    <>
      <output aria-label="Hovered index">{hoverDataIndex ?? 'none'}</output>
      <output aria-label="Clicked index">{clickedDataIndex ?? 'none'}</output>
      <button onClick={handleMouseLeave}>Clear hover</button>
    </>
  )
}

const withProvider = (chart: ReactElement | null): ReactElement => (
  <AnalyticsStateProvider>
    {chart}
    <StateProbe />
  </AnalyticsStateProvider>
)

const chartCases = [
  {
    name: 'StackedBarChart',
    chart: <StackedBarChart {...chartProps} bars={bars} />,
    chartMock: jest.mocked(BarChart),
  },
  {
    name: 'MultipleLineChart',
    chart: <MultipleLineChart {...chartProps} lines={bars} />,
    chartMock: jest.mocked(LineChart),
  },
  {
    name: 'AreaChart',
    chart: (
      <AreaChart
        blur={false}
        currency={CurrencyEnum.Usd}
        data={[
          { axisName: 'January', value: 100, tooltipLabel: 'January: 100' },
          { axisName: 'February', value: 200, tooltipLabel: 'February: 200' },
        ]}
      />
    ),
    chartMock: jest.mocked(RechartAreaChart),
  },
]

const originalDefaultZone = Settings.defaultZone

beforeEach(() => {
  jest.useFakeTimers()
  jest.advanceTimersByTime(100)
  jest.clearAllMocks()
  Settings.defaultZone = 'UTC'

  for (const { chartMock } of chartCases) {
    chartMock.mockImplementation(({ children }) => <div>{children}</div>)
  }
  jest.mocked(RechartAreaChart).mockImplementation(({ children }) => <svg>{children}</svg>)
})

afterEach(() => {
  jest.useRealTimers()
  Settings.defaultZone = originalDefaultZone
})

describe.each(chartCases)('$name hover behavior', ({ chart, chartMock }) => {
  const moveTo = (index: number): void => {
    act(() => {
      chartMock.mock.calls.at(-1)?.[0].onMouseMove?.({ activeTooltipIndex: index }, undefined)
    })
  }

  const leave = (): void => {
    act(() => {
      chartMock.mock.calls.at(-1)?.[0].onMouseLeave?.({}, undefined)
    })
  }

  it('keeps the final hovered index when movement ends within one frame', () => {
    render(withProvider(chart))

    moveTo(0)
    expect(screen.getByLabelText('Hovered index')).toHaveTextContent('0')
    moveTo(1)
    act(() => jest.advanceTimersByTime(100))

    expect(screen.getByLabelText('Hovered index')).toHaveTextContent('1')
    expect(mockTooltip.mock.calls.at(-1)?.[0]).toMatchObject({
      active: true,
      defaultIndex: 1,
    })
  })

  it('clears immediately on rapid mouse leave and never restores a trailing hover', () => {
    render(withProvider(chart))

    moveTo(0)
    moveTo(1)
    leave()

    expect(screen.getByLabelText('Hovered index')).toHaveTextContent('none')
    expect(mockTooltip.mock.calls.at(-1)?.[0].active).toBe(false)
    act(() => jest.advanceTimersByTime(100))
    expect(screen.getByLabelText('Hovered index')).toHaveTextContent('none')
  })

  it('allows immediate reentry to the same index without a delayed clear', () => {
    render(withProvider(chart))

    moveTo(0)
    leave()
    moveTo(0)
    act(() => jest.advanceTimersByTime(100))

    expect(screen.getByLabelText('Hovered index')).toHaveTextContent('0')
  })

  it('leaves no pending chart update after unmounting inside a shared provider', () => {
    const { rerender } = render(withProvider(chart))

    moveTo(0)
    moveTo(1)
    rerender(withProvider(null))
    act(() => screen.getByRole('button', { name: 'Clear hover' }).click())
    act(() => jest.advanceTimersByTime(100))

    expect(screen.getByLabelText('Hovered index')).toHaveTextContent('none')
  })

  it('keeps click selection independent of hover clearing', () => {
    render(withProvider(chart))

    act(() => {
      chartMock.mock.calls.at(-1)?.[0].onClick?.({ activeTooltipIndex: 1 }, undefined)
    })
    moveTo(0)
    leave()

    expect(screen.getByLabelText('Clicked index')).toHaveTextContent('1')
  })
})

describe('StackedBarChart input ordering', () => {
  it('renders frozen bars and data in independent graph and tooltip orders', () => {
    const frozenBars = [...bars]
    const frozenData = data.map((item) => Object.freeze({ ...item }))

    Object.freeze(frozenBars)
    Object.freeze(frozenData)
    mockTooltip.mockImplementation((props) => {
      if (!props.active || typeof props.content !== 'function') return null

      return (
        <section aria-label="Chart tooltip">
          {props.content({ ...props, payload: [{ payload: frozenData[0] }] })}
        </section>
      )
    })

    render(withProvider(<StackedBarChart {...chartProps} bars={frozenBars} data={frozenData} />))

    const getRenderedBarKeys = (): unknown[] =>
      jest
        .mocked(Bar)
        .mock.calls.slice(-bars.length)
        .map(([props]) => props.dataKey)

    expect(getRenderedBarKeys()).toEqual(['second', 'third', 'first'])
    act(() => {
      jest
        .mocked(BarChart)
        .mock.calls.at(-1)?.[0]
        .onMouseMove?.({ activeTooltipIndex: 0 }, undefined)
      jest.advanceTimersByTime(100)
    })

    expect(screen.getByLabelText('Chart tooltip')).toHaveTextContent(/Third.*First.*Second/)
    expect(getRenderedBarKeys()).toEqual(['second', 'third', 'first'])
    expect(frozenBars.map((bar) => bar.dataKey)).toEqual(['first', 'second', 'third'])
    expect(frozenData).toEqual(data)
  })

  it.each([{ loading: true }, { blur: true }])(
    'renders the shared frozen fixture without mutating it for %j',
    (props) => {
      const originalOrder = multipleStackedBarChartLoadingFakeBars.map((bar) => bar.dataKey)

      Object.freeze(multipleStackedBarChartLoadingFakeBars)
      render(withProvider(<StackedBarChart {...chartProps} bars={bars} {...props} />))

      expect(multipleStackedBarChartLoadingFakeBars.map((bar) => bar.dataKey)).toEqual(
        originalOrder,
      )
    },
  )
})
