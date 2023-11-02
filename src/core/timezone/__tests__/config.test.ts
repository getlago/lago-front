import { TimeZonesConfig } from '../config'

describe('Timezone fongis', () => {
  describe('TimeZonesConfig', () => {
    it('returns expected config values', () => {
      expect(TimeZonesConfig['TZ_ASIA_TOKYO']).toStrictEqual({
        name: 'Asia/Tokyo',
        offset: '+9:00',
        offsetInMinute: 540,
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
