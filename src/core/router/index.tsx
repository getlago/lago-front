import type { RouteObject } from 'react-router-dom'
import Home from '~/pages/Home'
import Test from '~/pages/Test'
import Test2 from '~/pages/Test2'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
    children: [
      {
        index: true,
        element: <Test />,
      },
      {
        path: '/test2',
        element: <Test2 />,
      },
    ],
  },
]
