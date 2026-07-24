import { gql } from '@apollo/client'

import { type AddQuoteImageInput, useAddQuoteImageMutation } from '~/generated/graphql'

gql`
  mutation addQuoteImage($input: AddQuoteImageInput!) {
    addQuoteImage(input: $input) {
      id
      url
    }
  }
`

export const useAddQuoteImage = () => {
  const [addQuoteImageMutation, { loading: isUploadingImage }] = useAddQuoteImageMutation()

  const addQuoteImage = async (input: AddQuoteImageInput): Promise<{ id: string; url: string }> => {
    const result = await addQuoteImageMutation({
      variables: { input },
      // Merge the uploaded blob into the normalized Quote.images map so every
      // consumer of quote.images (on-screen editor + all PDF download actions)
      // resolves the freshly-uploaded image without waiting for a refetch.
      update: (cache, { data }) => {
        const image = data?.addQuoteImage

        if (!image) return

        cache.modify({
          id: cache.identify({ __typename: 'Quote', id: input.id }),
          fields: {
            images(existing = {}) {
              return { ...existing, [image.id]: image.url }
            },
          },
        })
      },
    })

    if (!result.data?.addQuoteImage) {
      throw new Error('Quote image upload failed')
    }

    return result.data.addQuoteImage
  }

  return { addQuoteImage, isUploadingImage }
}
