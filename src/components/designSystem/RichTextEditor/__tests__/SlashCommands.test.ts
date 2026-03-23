import { slashCommandItems } from '../extensions/SlashCommands'

describe('SlashCommands', () => {
  describe('slashCommandItems', () => {
    describe('GIVEN the slash command items are defined', () => {
      it('THEN should contain all expected commands', () => {
        const titles = slashCommandItems.map((item) => item.title)

        expect(titles).toEqual([
          'Heading 1',
          'Heading 2',
          'Heading 3',
          'Bullet List',
          'Table',
          'Code Block',
        ])
      })

      it.each(slashCommandItems)(
        'THEN each item "$title" should have a description and command',
        (item) => {
          expect(item.description).toBeTruthy()
          expect(typeof item.command).toBe('function')
        },
      )
    })

    describe('GIVEN the suggestion config', () => {
      describe('WHEN filtering items with a query', () => {
        const filterItems = (query: string) =>
          slashCommandItems.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))

        it('THEN should return all items for empty query', () => {
          expect(filterItems('')).toHaveLength(6)
        })

        it('THEN should filter items by title case-insensitively', () => {
          const results = filterItems('head')

          expect(results).toHaveLength(3)
          expect(results.map((r) => r.title)).toEqual(['Heading 1', 'Heading 2', 'Heading 3'])
        })

        it('THEN should return empty array for non-matching query', () => {
          expect(filterItems('nonexistent')).toHaveLength(0)
        })

        it('THEN should find table command', () => {
          const results = filterItems('table')

          expect(results).toHaveLength(1)
          expect(results[0].title).toBe('Table')
        })
      })
    })
  })
})
