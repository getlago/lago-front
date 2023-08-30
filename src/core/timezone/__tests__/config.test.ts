import { TimeZonesConfig } from '../config'

describe('Timezone fongis', () => {
  describe('TimeZonesConfig', () => {
    it('returns expected config values', () => {
      expect(TimeZonesConfig['TZ_EUROPE_PARIS']).toStrictEqual({
        name: 'Europe/Paris',
        offset: '+2:00',
        offsetInMinute: 120,
      })
      expect(TimeZonesConfig['TZ_AMERICA_LOS_ANGELES']).toStrictEqual({
        name: 'America/Los_Angeles',
        offset: '-7:00',
        offsetInMinute: -420,
      })
      expect(TimeZonesConfig['TZ_UTC']).toStrictEqual({
        name: 'UTC',
        offset: '±0:00',
        offsetInMinute: 0,
      })
    })
  })
})
