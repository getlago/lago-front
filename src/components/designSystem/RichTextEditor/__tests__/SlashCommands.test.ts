import { slashCommandDefinitions } from '../extensions/SlashCommands'

const mockTranslate = (key: string): string => {
  const translations: Record<string, string> = {
    text_1774281559656dn2u208gh80: 'Heading 1',
    text_1774281559656pla0xamsvmf: 'Large section heading',
    text_1774281559657ec0exeaqqd3: 'Heading 2',
    text_1774281559657q7h8pu6455p: 'Medium section heading',
    text_1774281559657t0kkn628zdy: 'Heading 3',
    text_1774281559657o48ilt0rq5y: 'Small section heading',
    text_1774281559657cbz20fzcjka: 'Bullet List',
    text_17742815596575m8mqwrg1qy: 'Unordered list',
    text_1774281559657yc3z031hm6x: 'Table',
    text_1774281559657y9saycc2aev: 'Insert a 3x3 table',
    text_1774281559657l4kkx9ws4mz: 'Code Block',
    text_1774281559657qdknwsvn5ka: 'Insert a code block',
  }

  return translations[key] ?? key
}

const resolveItems = () =>
  slashCommandDefinitions.map((def) => ({
    title: mockTranslate(def.titleKey),
    description: mockTranslate(def.descriptionKey),
    command: def.command,
  }))

describe('SlashCommands', () => {
  describe('slashCommandDefinitions', () => {
    describe('GIVEN the slash command definitions are defined', () => {
      it('THEN should contain all expected translation keys', () => {
        const titleKeys = slashCommandDefinitions.map((def) => def.titleKey)

        expect(titleKeys).toEqual([
          'text_1774281559656dn2u208gh80',
          'text_1774281559657ec0exeaqqd3',
          'text_1774281559657t0kkn628zdy',
          'text_1774281559657cbz20fzcjka',
          'text_1774281559657yc3z031hm6x',
          'text_1774281559657l4kkx9ws4mz',
        ])
      })

      it.each(slashCommandDefinitions)(
        'THEN each definition should have a descriptionKey and command',
        (def) => {
          expect(def.descriptionKey).toBeTruthy()
          expect(typeof def.command).toBe('function')
        },
      )
    })

    describe('GIVEN the suggestion config', () => {
      describe('WHEN filtering resolved items with a query', () => {
        const filterItems = (query: string) => {
          const items = resolveItems()

          return items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
        }

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

    describe('GIVEN a command is executed', () => {
      const createMockEditor = () => {
        const runMock = jest.fn()
        const chainMethods: Record<string, jest.Mock> = {}

        const handler: ProxyHandler<Record<string, jest.Mock>> = {
          get: (_target, prop: string) => {
            if (prop === 'run') return runMock
            if (!chainMethods[prop]) {
              chainMethods[prop] = jest.fn().mockReturnValue(new Proxy({}, handler))
            }

            return chainMethods[prop]
          },
        }

        return {
          chain: jest.fn().mockReturnValue(new Proxy({}, handler)),
          runMock,
        }
      }

      it.each([
        ['Heading 1', 0],
        ['Heading 2', 1],
        ['Heading 3', 2],
        ['Bullet List', 3],
        ['Table', 4],
        ['Code Block', 5],
      ])('WHEN "%s" command is called THEN should invoke editor chain', (_, index) => {
        const mockEditor = createMockEditor()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slashCommandDefinitions[index as number].command(mockEditor as any)

        expect(mockEditor.chain).toHaveBeenCalled()
        expect(mockEditor.runMock).toHaveBeenCalled()
      })
    })
  })
})
