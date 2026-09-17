import { MouseEvent } from 'react'

import { isModifiedClick } from '../isModifiedClick'

const buildClick = (overrides: Partial<MouseEvent> = {}) =>
  ({
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  }) as MouseEvent

describe('isModifiedClick', () => {
  describe('GIVEN a plain primary click', () => {
    describe('WHEN it is evaluated', () => {
      it('THEN should report the app owns the click', () => {
        expect(isModifiedClick(buildClick())).toBe(false)
      })
    })
  })

  describe('GIVEN the browser should open the target itself', () => {
    describe('WHEN a modifier is held or a secondary button is used', () => {
      it.each([
        ['a meta click', { metaKey: true }],
        ['a ctrl click', { ctrlKey: true }],
        ['a shift click', { shiftKey: true }],
        ['an alt click', { altKey: true }],
        ['a middle click', { button: 1 }],
      ])('THEN should report %s as browser-owned', (_, overrides) => {
        expect(isModifiedClick(buildClick(overrides))).toBe(true)
      })
    })
  })
})
