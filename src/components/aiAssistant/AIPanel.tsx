import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Icon, Typography } from 'lago-design-system'
import { useEffect, useState } from 'react'

import { TextInputField } from '~/components/form'
import { useCreateAiConversationMutation, useOnConversationSubscription } from '~/generated/graphql'

gql`
  subscription onConversation($conversationId: ID!) {
    aiConversationStreamed(conversationId: $conversationId) {
      id
      conversationId
      inputData
      organization {
        id
      }
      updatedAt
    }
  }

  mutation createAiConversation($input: CreateAiConversationInput!) {
    createAiConversation(input: $input) {
      conversationId
      inputData
    }
  }
`

export const AIPanel = () => {
  const [conversationId, setConversationId] = useState('')

  const [createAiConversation, { loading: mutationLoading, error: mutationError }] =
    useCreateAiConversationMutation()

  const formikProps = useFormik({
    initialValues: {
      prompt: '',
    },
    onSubmit: async (values) => {
      try {
        await createAiConversation({
          variables: { input: { inputData: values.prompt } },

          onCompleted: (data) => {
            if (!!data.createAiConversation?.conversationId) {
              setConversationId(data.createAiConversation.conversationId)
            }
          },
        })
      } catch {
        // Handle error silently or log to monitoring service
      }
    },
  })

  const { data, loading, error } = useOnConversationSubscription({
    variables: { conversationId: conversationId ?? '' },
    skip: !conversationId,
    onError: (errorData) => {
      console.log('🔴 Subscription error:', errorData)
    },
    onData: (dataData) => {
      console.log('🟢 Subscription data received:', dataData)
    },
    onComplete: () => {
      console.log('🟡 Subscription completed')
    },
  })

  // Monitor subscription state changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('🔄 Subscription state changed:', {
      conversationId,
      loading,
      error,
      data,
      hasConversationId: !!conversationId,
      timestamp: new Date().toISOString(),
    })
  }, [conversationId, loading, error, data])

  return (
    <div className="flex h-full flex-col justify-end">
      <div>
        <div className="mb-8 flex flex-col gap-4 px-4">
          <Typography variant="headline" color="grey700">
            Need insights or actions on your billing data?
          </Typography>
          <Typography variant="body" color="grey500">
            I’m here to help you move faster
          </Typography>

          {/* <div className="flex flex-wrap gap-2">
            <Button variant="tertiary" size="small">
              Revenue & Insights
            </Button>
            <Button variant="tertiary" size="small">
              Promotions & Adjustments
            </Button>
            <Button variant="tertiary" size="small">
              Customer Management
            </Button>
            <Button variant="tertiary" size="small">
              Pricing & Packages
            </Button>
            <Button variant="tertiary" size="small">
              Billing & Collections
            </Button>
            <Button variant="tertiary" size="small">
              Subscriptions & Usage
            </Button>
          </div> */}
        </div>

        {/*
      <div>
        {blockMatches.map((blockMatch, index) => {
          const Component = blockMatch.block.component

          return <Component key={index} blockMatch={blockMatch} />
        })}
      </div> */}

        {mutationLoading && <div>Loading...</div>}

        {mutationError && <div>Error: {mutationError.message}</div>}
        {/* 
        {subscriptionError && <div>Error: {subscriptionError.message}</div>}

        {subscriptionData && <div>Data: {JSON.stringify(subscriptionData)}</div>} */}

        <form className="flex w-full flex-col gap-4" onSubmit={formikProps.handleSubmit}>
          <div className="relative">
            <TextInputField
              multiline
              rows={2}
              id="prompt"
              name="prompt"
              formikProps={formikProps}
              className="w-full resize-none"
              placeholder="What's next?"
            />

            <button type="submit" className="absolute right-4 top-3 size-6">
              <Icon name="arrow-right" />
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            Recent conversations
          </Typography>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption" color="grey600">
                Overdue Invoices – July
              </Typography>
              <Typography
                variant="caption"
                color="grey600"
                className="inline-block h-7 rounded-lg border border-grey-400 px-2"
              >
                1h
              </Typography>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption" color="grey600">
                Overdue Invoices – July
              </Typography>
              <Typography
                variant="caption"
                color="grey600"
                className="inline-block h-7 rounded-lg border border-grey-400 px-2"
              >
                1h
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
