const symbols: { [key: number]: string } = {
  1: '\uD802\uDDC0',
  2: '\uD802\uDDC1',
  3: '\uD802\uDDC2',
  4: '\uD802\uDDC3',
  5: '\uD802\uDDC4',
  6: '\uD802\uDDC5',
  7: '\uD802\uDDC6',
  8: '\uD802\uDDC7',
  9: '\uD802\uDDC8',
  10: '\uD802\uDDC9',
  20: '\uD802\uDDCA',
  30: '\uD802\uDDCB',
  40: '\uD802\uDDCC',
  50: '\uD802\uDDCD',
  60: '\uD802\uDDCE',
  70: '\uD802\uDDCF',
  100: '\uD802\uDDD2',
  200: '\uD802\uDDD3',
  300: '\uD802\uDDD4',
  400: '\uD802\uDDD5',
  500: '\uD802\uDDD6',
  600: '\uD802\uDDD7',
  700: '\uD802\uDDD8',
  800: '\uD802\uDDD9',
  900: '\uD802\uDDDA',
  1000: '\uD802\uDDDB',
  2000: '\uD802\uDDDC',
  3000: '\uD802\uDDDD',
  4000: '\uD802\uDDDE',
  5000: '\uD802\uDDDF',
  6000: '\uD802\uDDE0',
  7000: '\uD802\uDDE1',
  8000: '\uD802\uDDE2',
  9000: '\uD802\uDDE3',
  10000: '\uD802\uDDE4',
}
const keys = Object.keys(symbols)
  .map(Number)
  .sort((a, b) => b - a)

export function toMeroiticCursiveNumber(number: number): string {
  let result = ''
  let remainingNumber = number

  for (const key of keys) {
    while (remainingNumber >= key) {
      result = symbols[key] + result
      remainingNumber -= key
    }
  }

  return result
}
