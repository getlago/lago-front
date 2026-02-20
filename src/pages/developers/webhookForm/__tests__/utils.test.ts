import { eventNameToFormKey, formKeyToEventName } from '~/hooks/useWebhookEventTypes'

import { eventTypesToFormValues, formValuesToEventTypes } from '../utils'

describe('webhookForm utils', () => {
  describe('eventNameToFormKey', () => {
    describe('GIVEN an event name with dots', () => {
      describe('WHEN converting to form key', () => {
        it.each([
          ['customer.created', 'customer__created'],
          ['invoice.payment_status_updated', 'invoice__payment_status_updated'],
          ['subscription.started', 'subscription__started'],
        ])('THEN should convert %s to %s', (eventName, expected) => {
          expect(eventNameToFormKey(eventName)).toBe(expected)
        })
      })
    })

    describe('GIVEN an event name without dots', () => {
      describe('WHEN converting to form key', () => {
        it('THEN should return the same string', () => {
          expect(eventNameToFormKey('customer')).toBe('customer')
        })
      })
    })

    describe('GIVEN an event name with multiple dots', () => {
      describe('WHEN converting to form key', () => {
        it('THEN should replace all dots with double underscores', () => {
          expect(eventNameToFormKey('a.b.c')).toBe('a__b__c')
        })
      })
    })
  })

  describe('formKeyToEventName', () => {
    describe('GIVEN a form key with double underscores', () => {
      describe('WHEN converting to event name', () => {
        it.each([
          ['customer__created', 'customer.created'],
          ['invoice__payment_status_updated', 'invoice.payment_status_updated'],
          ['subscription__started', 'subscription.started'],
        ])('THEN should convert %s to %s', (formKey, expected) => {
          expect(formKeyToEventName(formKey)).toBe(expected)
        })
      })
    })

    describe('GIVEN a form key without double underscores', () => {
      describe('WHEN converting to event name', () => {
        it('THEN should return the same string', () => {
          expect(formKeyToEventName('customer')).toBe('customer')
        })
      })
    })

    describe('GIVEN a form key with multiple double underscores', () => {
      describe('WHEN converting to event name', () => {
        it('THEN should replace all double underscores with dots', () => {
          expect(formKeyToEventName('a__b__c')).toBe('a.b.c')
        })
      })
    })
  })

  describe('formValuesToEventTypes', () => {
    describe('GIVEN all events are selected', () => {
      describe('WHEN converting to event types', () => {
        it('THEN should return null (filtering OFF)', () => {
          const webhookEvents = {
            customer__created: true,
            invoice__created: true,
            subscription__started: true,
          }

          expect(formValuesToEventTypes(webhookEvents)).toBeNull()
        })
      })
    })

    describe('GIVEN no events are selected', () => {
      describe('WHEN converting to event types', () => {
        it('THEN should return empty array', () => {
          const webhookEvents = {
            customer__created: false,
            invoice__created: false,
            subscription__started: false,
          }

          expect(formValuesToEventTypes(webhookEvents)).toEqual([])
        })
      })
    })

    describe('GIVEN some events are selected', () => {
      describe('WHEN converting to event types', () => {
        it('THEN should return array with selected event names', () => {
          const webhookEvents = {
            customer__created: true,
            invoice__created: false,
            subscription__started: true,
          }

          const result = formValuesToEventTypes(webhookEvents)

          expect(result).toEqual(['customer.created', 'subscription.started'])
        })
      })
    })

    describe('GIVEN an empty record', () => {
      describe('WHEN converting to event types', () => {
        it('THEN should return null (all selected means filtering OFF)', () => {
          const webhookEvents = {}

          expect(formValuesToEventTypes(webhookEvents)).toBeNull()
        })
      })
    })
  })

  describe('eventTypesToFormValues', () => {
    const allFormKeys = ['customer__created', 'invoice__created', 'subscription__started']

    describe('GIVEN eventTypes is null', () => {
      describe('WHEN converting to form values', () => {
        it('THEN should return all keys set to true (listening to all)', () => {
          const result = eventTypesToFormValues(null, allFormKeys)

          expect(result).toEqual({
            customer__created: true,
            invoice__created: true,
            subscription__started: true,
          })
        })
      })
    })

    describe('GIVEN eventTypes is undefined', () => {
      describe('WHEN converting to form values', () => {
        it('THEN should return all keys set to true (listening to all)', () => {
          const result = eventTypesToFormValues(undefined, allFormKeys)

          expect(result).toEqual({
            customer__created: true,
            invoice__created: true,
            subscription__started: true,
          })
        })
      })
    })

    describe('GIVEN eventTypes is an empty array', () => {
      describe('WHEN converting to form values', () => {
        it('THEN should return all keys set to false (listening to none)', () => {
          const result = eventTypesToFormValues([], allFormKeys)

          expect(result).toEqual({
            customer__created: false,
            invoice__created: false,
            subscription__started: false,
          })
        })
      })
    })

    describe('GIVEN eventTypes has specific events', () => {
      describe('WHEN converting to form values', () => {
        it('THEN should return matching keys set to true, others false', () => {
          const eventTypes = ['customer.created', 'subscription.started']
          const result = eventTypesToFormValues(eventTypes, allFormKeys)

          expect(result).toEqual({
            customer__created: true,
            invoice__created: false,
            subscription__started: true,
          })
        })
      })
    })

    describe('GIVEN eventTypes has events not in allFormKeys', () => {
      describe('WHEN converting to form values', () => {
        it('THEN should ignore unknown events', () => {
          const eventTypes = ['customer.created', 'unknown.event']
          const result = eventTypesToFormValues(eventTypes, allFormKeys)

          expect(result).toEqual({
            customer__created: true,
            invoice__created: false,
            subscription__started: false,
          })
        })
      })
    })

    describe('GIVEN allFormKeys is empty', () => {
      describe('WHEN converting to form values', () => {
        it('THEN should return empty object regardless of eventTypes', () => {
          expect(eventTypesToFormValues(null, [])).toEqual({})
          expect(eventTypesToFormValues(['customer.created'], [])).toEqual({})
        })
      })
    })
  })
})
