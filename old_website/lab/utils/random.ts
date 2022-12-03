// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

function createMasher() {
  let n = 0xefc8249d

  return (data: string) => {
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i)
      let h = 0.02519603282416938 * n
      n = h >>> 0
      h -= n
      h *= n
      n = h >>> 0
      h -= n
      n += h * 0x100000000 // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10 // 2^-32
  }
}

export interface Randomizer {
  int32(): number
  double(): number
}

export function createRandomizer(seed: string): Randomizer {
  const mash = createMasher()

  // Apply the seeding algorithm from Baagoe.
  let c: number = 1
  let s0: number = mash(' ')
  let s1: number = mash(' ')
  let s2: number = mash(' ')
  s0 -= mash(seed)
  if (s0 < 0) {
    s0 += 1
  }
  s1 -= mash(seed)
  if (s1 < 0) {
    s1 += 1
  }
  s2 -= mash(seed)
  if (s2 < 0) {
    s2 += 1
  }

  function next() {
    let t = 2091639 * s0 + c * 2.3283064365386963e-10 // 2^-32
    s0 = s1
    s1 = s2
    return (s2 = t - (c = t | 0))
  }

  function int32() {
    return (next() * 0x100000000) | 0
  }

  function double() {
    return next() + ((next() * 0x200000) | 0) * 1.1102230246251565e-16 // 2^-53
  }

  return { int32, double }
}
