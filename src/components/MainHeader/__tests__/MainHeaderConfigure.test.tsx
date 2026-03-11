import { FC } from 'react'

import { render } from '~/test-utils'

import { MainHeaderConfigure } from '../MainHeaderConfigure'
import { MainHeaderProvider, useMainHeaderReader } from '../MainHeaderContext'
import { MainHeaderConfig } from '../types'

const mockConfig: MainHeaderConfig = {
  title: 'Page Title',
  backButton: { path: '/back' },
}

describe('MainHeaderConfigure', () => {
  describe('GIVEN the component is rendered', () => {
    describe('WHEN mounted with config props', () => {
      it('THEN should render nothing (returns null)', () => {
        const { container } = render(
          <MainHeaderProvider>
            <MainHeaderConfigure {...mockConfig} />
          </MainHeaderProvider>,
        )

        expect(container.innerHTML).toBe('')
      })
    })

    describe('WHEN mounted with a config', () => {
      it('THEN should push config to context', () => {
        const ReadConfigSpy: FC<{ onConfig: (config: MainHeaderConfig | null) => void }> = ({
          onConfig,
        }) => {
          const { config } = useMainHeaderReader()

          onConfig(config)

          return null
        }

        let capturedConfig: MainHeaderConfig | null = null

        render(
          <MainHeaderProvider>
            <MainHeaderConfigure {...mockConfig} />
            <ReadConfigSpy onConfig={(c) => (capturedConfig = c)} />
          </MainHeaderProvider>,
        )

        expect(capturedConfig).toEqual(mockConfig)
      })
    })

    describe('WHEN unmounted', () => {
      it('THEN should reset config to null', () => {
        const ReadConfigSpy: FC<{ onConfig: (config: MainHeaderConfig | null) => void }> = ({
          onConfig,
        }) => {
          const { config } = useMainHeaderReader()

          onConfig(config)

          return null
        }

        let capturedConfig: MainHeaderConfig | null = null

        const { rerender } = render(
          <MainHeaderProvider>
            <MainHeaderConfigure {...mockConfig} />
            <ReadConfigSpy onConfig={(c) => (capturedConfig = c)} />
          </MainHeaderProvider>,
        )

        expect(capturedConfig).toEqual(mockConfig)

        rerender(
          <MainHeaderProvider>
            <ReadConfigSpy onConfig={(c) => (capturedConfig = c)} />
          </MainHeaderProvider>,
        )

        expect(capturedConfig).toBeNull()
      })
    })
  })

  describe('GIVEN the config changes', () => {
    describe('WHEN a new title is provided', () => {
      it('THEN should update the context config', () => {
        const ReadConfigSpy: FC<{ onConfig: (config: MainHeaderConfig | null) => void }> = ({
          onConfig,
        }) => {
          const { config } = useMainHeaderReader()

          onConfig(config)

          return null
        }

        let capturedConfig: MainHeaderConfig | null = null

        const { rerender } = render(
          <MainHeaderProvider>
            <MainHeaderConfigure title="First Title" />
            <ReadConfigSpy onConfig={(c) => (capturedConfig = c)} />
          </MainHeaderProvider>,
        )

        expect(capturedConfig).toEqual(expect.objectContaining({ title: 'First Title' }))

        rerender(
          <MainHeaderProvider>
            <MainHeaderConfigure title="Updated Title" />
            <ReadConfigSpy onConfig={(c) => (capturedConfig = c)} />
          </MainHeaderProvider>,
        )

        expect(capturedConfig).toEqual(expect.objectContaining({ title: 'Updated Title' }))
      })
    })
  })
})
