// @ts-check
import path from 'node:path'
import fs from 'node:fs'
import { hierarchy, pack } from 'd3-hierarchy'

/**
 * @typedef {Object} Sponsor
 * @property {string} name
 * @property {string} login
 * @property {string} avatar
 * @property {number} amount
 * @property {string} link
 * @property {boolean} org
 * @property {boolean} isOneTime
 */

async function main() {
  console.log('Fetching sponsors...')
  /** @type {Sponsor[]} */
  const _sponsors = await fetch(
    'https://cdn.jsdelivr.net/gh/posva/sponsorkit-static/sk/sponsors.json',
  ).then((res) => res.json())

  console.log(`Found ${_sponsors.length} sponsors`)

  const amountMax = Math.max(..._sponsors.map((sponsor) => sponsor.amount))
  const RADIUS_MIN = 8
  const RADIUS_MAX = 300

  const sponsors = _sponsors
    .filter((sponsor) => sponsor.amount > 0)
    .map((sponsor, idx) => ({
      id: `sponsor-${idx}`,
      radius: 0,
      position: {
        x: 0,
        y: 0,
      },
      ...sponsor,
    }))

  const root = hierarchy({ ...sponsors[0], children: sponsors, id: 'root' })
    .sum((d) => 1 + lerp(RADIUS_MIN, RADIUS_MAX, (Math.max(0.1, d.amount || 0) / amountMax) ** 0.9))
    .sort((a, b) => (b.value || 0) - (a.value || 0))

  const p = pack()
  p.size([500, 500])
  p.padding(2)
  const circles = p(root).descendants().slice(1)

  for (const circle of circles) {
    const id = circle.data.id
    const sponsor = sponsors.find((s) => s.id === id)
    if (sponsor) {
      sponsor.position = { x: circle.x, y: circle.y }
      sponsor.radius = circle.r
    }
  }

  /**
   * Linearly interpolates between two numbers.
   *
   * @param {number} a - The starting value.
   * @param {number} b - The ending value.
   * @param {number} t - The interpolation factor (between 0 and 1).
   * @returns {number} The interpolated value.
   */
  function lerp(a, b, t) {
    if (t < 0) return a
    return a + (b - a) * t
  }

  const __dirname = new URL('.', import.meta.url).pathname

  console.log('Writing sponsors data...')
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true })
  fs.writeFileSync(
    path.join(__dirname, '../data/sponsors-circles.json'),
    JSON.stringify(sponsors, null, 2),
  )
  console.log('Done')
}

main()
