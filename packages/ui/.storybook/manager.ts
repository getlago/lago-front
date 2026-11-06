import 'lago-configs/fonts.css'
import { addons } from 'storybook/manager-api'

import { lagoTheme } from './theme'

addons.setConfig({ theme: lagoTheme })
