import { DateTime, Duration } from 'luxon'

const currentDate = DateTime.now().toISO()

const getOffset = (zone: string) => {
  const offsetInMinute = DateTime.fromISO(currentDate, { zone }).offset
  const sign = Math.sign(offsetInMinute)

  return isNaN(offsetInMinute)
    ? 'NaN'
    : Duration.fromObject({
        minutes: Math.abs(DateTime.fromISO(currentDate, { zone }).offset),
      }).toFormat(`${sign === -1 ? '-' : offsetInMinute === 0 ? '±' : '+'}h:mm`)
}

export interface TimezoneConfigObject {
  name: string
  offset: string
}

export const TimeZonesConfig: Record<string, TimezoneConfigObject> = {
  TZ_AFRICA_ALGIERS: {
    name: 'Africa/Algiers',
    offset: getOffset('Africa/Algiers'),
  },
  TZ_AFRICA_CAIRO: {
    name: 'Africa/Cairo',
    offset: getOffset('Africa/Cairo'),
  },
  TZ_AFRICA_CASABLANCA: {
    name: 'Africa/Casablanca',
    offset: getOffset('Africa/Casablanca'),
  },
  TZ_AFRICA_HARARE: {
    name: 'Africa/Harare',
    offset: getOffset('Africa/Harare'),
  },
  TZ_AFRICA_JOHANNESBURG: {
    name: 'Africa/Johannesburg',
    offset: getOffset('Africa/Johannesburg'),
  },
  TZ_AFRICA_MONROVIA: {
    name: 'Africa/Monrovia',
    offset: getOffset('Africa/Monrovia'),
  },
  TZ_AFRICA_NAIROBI: {
    name: 'Africa/Nairobi',
    offset: getOffset('Africa/Nairobi'),
  },
  TZ_AMERICA_ARGENTINA_BUENOS_AIRES: {
    name: 'America/Argentina/Buenos_Aires',
    offset: getOffset('America/Argentina/Buenos_Aires'),
  },
  TZ_AMERICA_BOGOTA: {
    name: 'America/Bogota',
    offset: getOffset('America/Bogota'),
  },
  TZ_AMERICA_CARACAS: {
    name: 'America/Caracas',
    offset: getOffset('America/Caracas'),
  },
  TZ_AMERICA_CHICAGO: {
    name: 'America/Chicago',
    offset: getOffset('America/Chicago'),
  },
  TZ_AMERICA_CHIHUAHUA: {
    name: 'America/Chihuahua',
    offset: getOffset('America/Chihuahua'),
  },
  TZ_AMERICA_DENVER: {
    name: 'America/Denver',
    offset: getOffset('America/Denver'),
  },
  TZ_AMERICA_GODTHAB: {
    name: 'America/Godthab',
    offset: getOffset('America/Godthab'),
  },
  TZ_AMERICA_GUATEMALA: {
    name: 'America/Guatemala',
    offset: getOffset('America/Guatemala'),
  },
  TZ_AMERICA_GUYANA: {
    name: 'America/Guyana',
    offset: getOffset('America/Guyana'),
  },
  TZ_AMERICA_HALIFAX: {
    name: 'America/Halifax',
    offset: getOffset('America/Halifax'),
  },
  TZ_AMERICA_INDIANA_INDIANAPOLIS: {
    name: 'America/Indiana/Indianapolis',
    offset: getOffset('America/Indiana/Indianapolis'),
  },
  TZ_AMERICA_JUNEAU: {
    name: 'America/Juneau',
    offset: getOffset('America/Juneau'),
  },
  TZ_AMERICA_LA_PAZ: {
    name: 'America/La_Paz',
    offset: getOffset('America/La_Paz'),
  },
  TZ_AMERICA_LIMA: {
    name: 'America/Lima',
    offset: getOffset('America/Lima'),
  },
  TZ_AMERICA_LOS_ANGELES: {
    name: 'America/Los_Angeles',
    offset: getOffset('America/Los_Angeles'),
  },
  TZ_AMERICA_MAZATLAN: {
    name: 'America/Mazatlan',
    offset: getOffset('America/Mazatlan'),
  },
  TZ_AMERICA_MEXICO_CITY: {
    name: 'America/Mexico_City',
    offset: getOffset('America/Mexico_City'),
  },
  TZ_AMERICA_MONTERREY: {
    name: 'America/Monterrey',
    offset: getOffset('America/Monterrey'),
  },
  TZ_AMERICA_MONTEVIDEO: {
    name: 'America/Montevideo',
    offset: getOffset('America/Montevideo'),
  },
  TZ_AMERICA_NEW_YORK: {
    name: 'America/New_York',
    offset: getOffset('America/New_York'),
  },
  TZ_AMERICA_PHOENIX: {
    name: 'America/Phoenix',
    offset: getOffset('America/Phoenix'),
  },
  TZ_AMERICA_PUERTO_RICO: {
    name: 'America/Puerto_Rico',
    offset: getOffset('America/Puerto_Rico'),
  },
  TZ_AMERICA_REGINA: {
    name: 'America/Regina',
    offset: getOffset('America/Regina'),
  },
  TZ_AMERICA_SANTIAGO: {
    name: 'America/Santiago',
    offset: getOffset('America/Santiago'),
  },
  TZ_AMERICA_SAO_PAULO: {
    name: 'America/Sao_Paulo',
    offset: getOffset('America/Sao_Paulo'),
  },
  TZ_AMERICA_ST_JOHNS: {
    name: 'America/St_Johns',
    offset: getOffset('America/St_Johns'),
  },
  TZ_AMERICA_TIJUANA: {
    name: 'America/Tijuana',
    offset: getOffset('America/Tijuana'),
  },
  TZ_ASIA_ALMATY: {
    name: 'Asia/Almaty',
    offset: getOffset('Asia/Almaty'),
  },
  TZ_ASIA_BAGHDAD: {
    name: 'Asia/Baghdad',
    offset: getOffset('Asia/Baghdad'),
  },
  TZ_ASIA_BAKU: {
    name: 'Asia/Baku',
    offset: getOffset('Asia/Baku'),
  },
  TZ_ASIA_BANGKOK: {
    name: 'Asia/Bangkok',
    offset: getOffset('Asia/Bangkok'),
  },
  TZ_ASIA_CHONGQING: {
    name: 'Asia/Chongqing',
    offset: getOffset('Asia/Chongqing'),
  },
  TZ_ASIA_COLOMBO: {
    name: 'Asia/Colombo',
    offset: getOffset('Asia/Colombo'),
  },
  TZ_ASIA_DHAKA: {
    name: 'Asia/Dhaka',
    offset: getOffset('Asia/Dhaka'),
  },
  TZ_ASIA_HONG_KONG: {
    name: 'Asia/Hong_Kong',
    offset: getOffset('Asia/Hong_Kong'),
  },
  TZ_ASIA_IRKUTSK: {
    name: 'Asia/Irkutsk',
    offset: getOffset('Asia/Irkutsk'),
  },
  TZ_ASIA_JAKARTA: {
    name: 'Asia/Jakarta',
    offset: getOffset('Asia/Jakarta'),
  },
  TZ_ASIA_JERUSALEM: {
    name: 'Asia/Jerusalem',
    offset: getOffset('Asia/Jerusalem'),
  },
  TZ_ASIA_KABUL: {
    name: 'Asia/Kabul',
    offset: getOffset('Asia/Kabul'),
  },
  TZ_ASIA_KAMCHATKA: {
    name: 'Asia/Kamchatka',
    offset: getOffset('Asia/Kamchatka'),
  },
  TZ_ASIA_KARACHI: {
    name: 'Asia/Karachi',
    offset: getOffset('Asia/Karachi'),
  },
  TZ_ASIA_KATHMANDU: {
    name: 'Asia/Kathmandu',
    offset: getOffset('Asia/Kathmandu'),
  },
  TZ_ASIA_KOLKATA: {
    name: 'Asia/Kolkata',
    offset: getOffset('Asia/Kolkata'),
  },
  TZ_ASIA_KRASNOYARSK: {
    name: 'Asia/Krasnoyarsk',
    offset: getOffset('Asia/Krasnoyarsk'),
  },
  TZ_ASIA_KUALA_LUMPUR: {
    name: 'Asia/Kuala_Lumpur',
    offset: getOffset('Asia/Kuala_Lumpur'),
  },
  TZ_ASIA_KUWAIT: {
    name: 'Asia/Kuwait',
    offset: getOffset('Asia/Kuwait'),
  },
  TZ_ASIA_MAGADAN: {
    name: 'Asia/Magadan',
    offset: getOffset('Asia/Magadan'),
  },
  TZ_ASIA_MUSCAT: {
    name: 'Asia/Muscat',
    offset: getOffset('Asia/Muscat'),
  },
  TZ_ASIA_NOVOSIBIRSK: {
    name: 'Asia/Novosibirsk',
    offset: getOffset('Asia/Novosibirsk'),
  },
  TZ_ASIA_RANGOON: {
    name: 'Asia/Rangoon',
    offset: getOffset('Asia/Rangoon'),
  },
  TZ_ASIA_RIYADH: {
    name: 'Asia/Riyadh',
    offset: getOffset('Asia/Riyadh'),
  },
  TZ_ASIA_SEOUL: {
    name: 'Asia/Seoul',
    offset: getOffset('Asia/Seoul'),
  },
  TZ_ASIA_SHANGHAI: {
    name: 'Asia/Shanghai',
    offset: getOffset('Asia/Shanghai'),
  },
  TZ_ASIA_SINGAPORE: {
    name: 'Asia/Singapore',
    offset: getOffset('Asia/Singapore'),
  },
  TZ_ASIA_SREDNEKOLYMSK: {
    name: 'Asia/Srednekolymsk',
    offset: getOffset('Asia/Srednekolymsk'),
  },
  TZ_ASIA_TAIPEI: {
    name: 'Asia/Taipei',
    offset: getOffset('Asia/Taipei'),
  },
  TZ_ASIA_TASHKENT: {
    name: 'Asia/Tashkent',
    offset: getOffset('Asia/Tashkent'),
  },
  TZ_ASIA_TBILISI: {
    name: 'Asia/Tbilisi',
    offset: getOffset('Asia/Tbilisi'),
  },
  TZ_ASIA_TEHRAN: {
    name: 'Asia/Tehran',
    offset: getOffset('Asia/Tehran'),
  },
  TZ_ASIA_TOKYO: {
    name: 'Asia/Tokyo',
    offset: getOffset('Asia/Tokyo'),
  },
  TZ_ASIA_ULAANBAATAR: {
    name: 'Asia/Ulaanbaatar',
    offset: getOffset('Asia/Ulaanbaatar'),
  },
  TZ_ASIA_URUMQI: {
    name: 'Asia/Urumqi',
    offset: getOffset('Asia/Urumqi'),
  },
  TZ_ASIA_VLADIVOSTOK: {
    name: 'Asia/Vladivostok',
    offset: getOffset('Asia/Vladivostok'),
  },
  TZ_ASIA_YAKUTSK: {
    name: 'Asia/Yakutsk',
    offset: getOffset('Asia/Yakutsk'),
  },
  TZ_ASIA_YEKATERINBURG: {
    name: 'Asia/Yekaterinburg',
    offset: getOffset('Asia/Yekaterinburg'),
  },
  TZ_ASIA_YEREVAN: {
    name: 'Asia/Yerevan',
    offset: getOffset('Asia/Yerevan'),
  },
  TZ_ATLANTIC_AZORES: {
    name: 'Atlantic/Azores',
    offset: getOffset('Atlantic/Azores'),
  },
  TZ_ATLANTIC_CAPE_VERDE: {
    name: 'Atlantic/Cape_Verde',
    offset: getOffset('Atlantic/Cape_Verde'),
  },
  TZ_ATLANTIC_SOUTH_GEORGIA: {
    name: 'Atlantic/South_Georgia',
    offset: getOffset('Atlantic/South_Georgia'),
  },
  TZ_AUSTRALIA_ADELAIDE: {
    name: 'Australia/Adelaide',
    offset: getOffset('Australia/Adelaide'),
  },
  TZ_AUSTRALIA_BRISBANE: {
    name: 'Australia/Brisbane',
    offset: getOffset('Australia/Brisbane'),
  },
  TZ_AUSTRALIA_DARWIN: {
    name: 'Australia/Darwin',
    offset: getOffset('Australia/Darwin'),
  },
  TZ_AUSTRALIA_HOBART: {
    name: 'Australia/Hobart',
    offset: getOffset('Australia/Hobart'),
  },
  TZ_AUSTRALIA_MELBOURNE: {
    name: 'Australia/Melbourne',
    offset: getOffset('Australia/Melbourne'),
  },
  TZ_AUSTRALIA_PERTH: {
    name: 'Australia/Perth',
    offset: getOffset('Australia/Perth'),
  },
  TZ_AUSTRALIA_SYDNEY: {
    name: 'Australia/Sydney',
    offset: getOffset('Australia/Sydney'),
  },
  TZ_EUROPE_AMSTERDAM: {
    name: 'Europe/Amsterdam',
    offset: getOffset('Europe/Amsterdam'),
  },
  TZ_EUROPE_ATHENS: {
    name: 'Europe/Athens',
    offset: getOffset('Europe/Athens'),
  },
  TZ_EUROPE_BELGRADE: {
    name: 'Europe/Belgrade',
    offset: getOffset('Europe/Belgrade'),
  },
  TZ_EUROPE_BERLIN: {
    name: 'Europe/Berlin',
    offset: getOffset('Europe/Berlin'),
  },
  TZ_EUROPE_BRATISLAVA: {
    name: 'Europe/Bratislava',
    offset: getOffset('Europe/Bratislava'),
  },
  TZ_EUROPE_BRUSSELS: {
    name: 'Europe/Brussels',
    offset: getOffset('Europe/Brussels'),
  },
  TZ_EUROPE_BUCHAREST: {
    name: 'Europe/Bucharest',
    offset: getOffset('Europe/Bucharest'),
  },
  TZ_EUROPE_BUDAPEST: {
    name: 'Europe/Budapest',
    offset: getOffset('Europe/Budapest'),
  },
  TZ_EUROPE_COPENHAGEN: {
    name: 'Europe/Copenhagen',
    offset: getOffset('Europe/Copenhagen'),
  },
  TZ_EUROPE_DUBLIN: {
    name: 'Europe/Dublin',
    offset: getOffset('Europe/Dublin'),
  },
  TZ_EUROPE_HELSINKI: {
    name: 'Europe/Helsinki',
    offset: getOffset('Europe/Helsinki'),
  },
  TZ_EUROPE_ISTANBUL: {
    name: 'Europe/Istanbul',
    offset: getOffset('Europe/Istanbul'),
  },
  TZ_EUROPE_KALININGRAD: {
    name: 'Europe/Kaliningrad',
    offset: getOffset('Europe/Kaliningrad'),
  },
  TZ_EUROPE_KIEV: {
    name: 'Europe/Kiev',
    offset: getOffset('Europe/Kiev'),
  },
  TZ_EUROPE_LISBON: {
    name: 'Europe/Lisbon',
    offset: getOffset('Europe/Lisbon'),
  },
  TZ_EUROPE_LJUBLJANA: {
    name: 'Europe/Ljubljana',
    offset: getOffset('Europe/Ljubljana'),
  },
  TZ_EUROPE_LONDON: {
    name: 'Europe/London',
    offset: getOffset('Europe/London'),
  },
  TZ_EUROPE_MADRID: {
    name: 'Europe/Madrid',
    offset: getOffset('Europe/Madrid'),
  },
  TZ_EUROPE_MINSK: {
    name: 'Europe/Minsk',
    offset: getOffset('Europe/Minsk'),
  },
  TZ_EUROPE_MOSCOW: {
    name: 'Europe/Moscow',
    offset: getOffset('Europe/Moscow'),
  },
  TZ_EUROPE_PARIS: {
    name: 'Europe/Paris',
    offset: getOffset('Europe/Paris'),
  },
  TZ_EUROPE_PRAGUE: {
    name: 'Europe/Prague',
    offset: getOffset('Europe/Prague'),
  },
  TZ_EUROPE_RIGA: {
    name: 'Europe/Riga',
    offset: getOffset('Europe/Riga'),
  },
  TZ_EUROPE_ROME: {
    name: 'Europe/Rome',
    offset: getOffset('Europe/Rome'),
  },
  TZ_EUROPE_SAMARA: {
    name: 'Europe/Samara',
    offset: getOffset('Europe/Samara'),
  },
  TZ_EUROPE_SARAJEVO: {
    name: 'Europe/Sarajevo',
    offset: getOffset('Europe/Sarajevo'),
  },
  TZ_EUROPE_SKOPJE: {
    name: 'Europe/Skopje',
    offset: getOffset('Europe/Skopje'),
  },
  TZ_EUROPE_SOFIA: {
    name: 'Europe/Sofia',
    offset: getOffset('Europe/Sofia'),
  },
  TZ_EUROPE_STOCKHOLM: {
    name: 'Europe/Stockholm',
    offset: getOffset('Europe/Stockholm'),
  },
  TZ_EUROPE_TALLINN: {
    name: 'Europe/Tallinn',
    offset: getOffset('Europe/Tallinn'),
  },
  TZ_EUROPE_VIENNA: {
    name: 'Europe/Vienna',
    offset: getOffset('Europe/Vienna'),
  },
  TZ_EUROPE_VILNIUS: {
    name: 'Europe/Vilnius',
    offset: getOffset('Europe/Vilnius'),
  },
  TZ_EUROPE_VOLGOGRAD: {
    name: 'Europe/Volgograd',
    offset: getOffset('Europe/Volgograd'),
  },
  TZ_EUROPE_WARSAW: {
    name: 'Europe/Warsaw',
    offset: getOffset('Europe/Warsaw'),
  },
  TZ_EUROPE_ZAGREB: {
    name: 'Europe/Zagreb',
    offset: getOffset('Europe/Zagreb'),
  },
  TZ_EUROPE_ZURICH: {
    name: 'Europe/Zurich',
    offset: getOffset('Europe/Zurich'),
  },
  TZ_GMT_12: {
    name: 'Etc/GMT+12',
    offset: getOffset('Etc/GMT+12'),
  },
  TZ_PACIFIC_APIA: {
    name: 'Pacific/Apia',
    offset: getOffset('Pacific/Apia'),
  },
  TZ_PACIFIC_AUCKLAND: {
    name: 'Pacific/Auckland',
    offset: getOffset('Pacific/Auckland'),
  },
  TZ_PACIFIC_CHATHAM: {
    name: 'Pacific/Chatham',
    offset: getOffset('Pacific/Chatham'),
  },
  TZ_PACIFIC_FAKAOFO: {
    name: 'Pacific/Fakaofo',
    offset: getOffset('Pacific/Fakaofo'),
  },
  TZ_PACIFIC_FIJI: {
    name: 'Pacific/Fiji',
    offset: getOffset('Pacific/Fiji'),
  },
  TZ_PACIFIC_GUADALCANAL: {
    name: 'Pacific/Guadalcanal',
    offset: getOffset('Pacific/Guadalcanal'),
  },
  TZ_PACIFIC_GUAM: {
    name: 'Pacific/Guam',
    offset: getOffset('Pacific/Guam'),
  },
  TZ_PACIFIC_HONOLULU: {
    name: 'Pacific/Honolulu',
    offset: getOffset('Pacific/Honolulu'),
  },
  TZ_PACIFIC_MAJURO: {
    name: 'Pacific/Majuro',
    offset: getOffset('Pacific/Majuro'),
  },
  TZ_PACIFIC_MIDWAY: {
    name: 'Pacific/Midway',
    offset: getOffset('Pacific/Midway'),
  },
  TZ_PACIFIC_NOUMEA: {
    name: 'Pacific/Noumea',
    offset: getOffset('Pacific/Noumea'),
  },
  TZ_PACIFIC_PAGO_PAGO: {
    name: 'Pacific/Pago_Pago',
    offset: getOffset('Pacific/Pago_Pago'),
  },
  TZ_PACIFIC_PORT_MORESBY: {
    name: 'Pacific/Port_Moresby',
    offset: getOffset('Pacific/Port_Moresby'),
  },
  TZ_PACIFIC_TONGATAPU: {
    name: 'Pacific/Tongatapu',
    offset: getOffset('Pacific/Tongatapu'),
  },
  TZ_UTC: {
    name: 'UTC',
    offset: getOffset('UTC'),
  },
}
