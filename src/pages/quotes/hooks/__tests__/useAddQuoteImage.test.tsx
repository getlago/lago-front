import { InMemoryCache } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { AddQuoteImageDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useAddQuoteImage } from '../useAddQuoteImage'

const mocks = [
  {
    request: {
      query: AddQuoteImageDocument,
      variables: { input: { id: 'quote-1', image: 'data:image/png;base64,AAA' } },
    },
    result: { data: { addQuoteImage: { id: 'blob-1', url: 'https://signed/blob-1' } } },
  },
]

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders mocks={mocks}>{children}</AllTheProviders>
)

describe('useAddQuoteImage', () => {
  describe('GIVEN a matching mutation mock', () => {
    describe('WHEN addQuoteImage is called', () => {
      it('THEN returns the created blob id and url', async () => {
        const { result } = renderHook(() => useAddQuoteImage(), { wrapper })

        let out: { id: string; url: string } | undefined

        await act(async () => {
          out = await result.current.addQuoteImage({
            id: 'quote-1',
            image: 'data:image/png;base64,AAA',
          })
        })

        expect(out).toEqual({ id: 'blob-1', url: 'https://signed/blob-1' })
      })

      it('THEN merges the uploaded blob into the cached Quote.images map', async () => {
        const cache = new InMemoryCache()

        cache.restore({
          'Quote:quote-1': {
            __typename: 'Quote',
            id: 'quote-1',
            images: { existing: 'https://signed/existing' },
          },
        })

        const cacheMocks = [
          {
            request: {
              query: AddQuoteImageDocument,
              variables: { input: { id: 'quote-1', image: 'data:image/png;base64,AAA' } },
            },
            result: { data: { addQuoteImage: { id: 'blob-1', url: 'https://signed/blob-1' } } },
          },
        ]

        const cacheWrapper = ({ children }: { children: ReactNode }) => (
          <MockedProvider cache={cache} mocks={cacheMocks}>
            {children}
          </MockedProvider>
        )

        const { result } = renderHook(() => useAddQuoteImage(), { wrapper: cacheWrapper })

        await act(async () => {
          await result.current.addQuoteImage({
            id: 'quote-1',
            image: 'data:image/png;base64,AAA',
          })
        })

        const extracted = cache.extract() as Record<string, { images?: Record<string, string> }>

        // Previously-persisted images are preserved and the new blob is added,
        // so every quote.images reader (editor + all PDF downloads) resolves it.
        expect(extracted['Quote:quote-1'].images).toEqual({
          existing: 'https://signed/existing',
          'blob-1': 'https://signed/blob-1',
        })
      })
    })
  })
})
