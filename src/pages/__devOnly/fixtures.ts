import { DateTime } from 'luxon'

import { IconName } from '~/components/designSystem'
import { TToast } from '~/core/apolloClient'

export const POSSIBLE_TOAST: TToast[] = [
  {
    id: 'toast0',
    severity: 'success',
    message: '🍞 Success',
  },
  {
    id: 'toast1',
    severity: 'info',
    message: '🍞 Info',
  },
  {
    id: 'toast2',
    severity: 'danger',
    message: '🍞 Danger',
  },
  {
    id: 'toast3',
    severity: 'success',
    message: '👍 Congrats you did something',
  },
  {
    id: 'toast4',
    severity: 'info',
    message: '👀 I see you',
  },
  {
    id: 'toast5',
    severity: 'danger',
    message: '👿 Please stop doing that',
  },
]

export const tableData: Array<{
  status: string
  id: string
  amount: number
  customer: string
  date: string
}> = [
  {
    status: 'succeeded',
    id: 'ABC-DEF-000-001',
    amount: 1000,
    customer: 'JohnDoe.com',
    date: DateTime.utc(2024, 5, 25).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'finalized',
    id: 'GHI-JKL-000-002',
    amount: 50,
    customer: 'DereckSons.org',
    date: DateTime.utc(2021, 10, 1).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'pay',
    id: 'MNO-PQR-000-003',
    amount: 2000,
    customer: 'FruitShop Inc',
    date: DateTime.utc(2023, 12, 5).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'pay',
    id: 'STW-XYZ-000-004',
    amount: 50000,
    customer: 'Pineapple Corp',
    date: DateTime.utc(2001, 1, 30).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'pay',
    id: 'AA-BB-CC-DD-000-001',
    amount: 991003,
    customer: 'AppCo',
    date: DateTime.utc(2013, 3, 16).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'pay',
    id: 'AA-BB-CC-DD-000-001',
    amount: 991003,
    customer: 'AppCo',
    date: DateTime.utc(2013, 3, 16).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'pay',
    id: 'AA-BB-CC-DD-000-001',
    amount: 991003,
    customer: 'AppCo',
    date: DateTime.utc(2013, 3, 16).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
  {
    status: 'pay',
    id: 'AA-BB-CC-DD-000-001',
    amount: 991003,
    customer: 'AppCo',
    date: DateTime.utc(2013, 3, 16).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
  },
]

export const chargeTableData: Array<{
  name: string
  job: string
  icon: IconName
}> = [
  {
    name: 'Barney Stinson',
    job: 'We will never know',
    icon: 'plug',
  },
  {
    name: 'Lily Aldrin',
    job: 'Kindergarden teacher',
    icon: 'book',
  },
  {
    name: 'Marshal Eriksen',
    job: 'Lawyer',
    icon: 'bank',
  },
  {
    name: 'Robin Scherbatzki',
    job: 'News anchor',
    icon: 'rocket',
  },
  {
    name: 'Ted Mosby',
    job: 'Architect',
    icon: 'company',
  },
]
