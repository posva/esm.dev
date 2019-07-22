const main = document.getElementById('main')
let angle = 0
const angleIncrement = (0.5 * Math.PI) / 128
const TWO_PI = Math.PI * 2
const offsetBase = 1.55

const delay = t => new Promise(r => setTimeout(r, t))

export async function rotateOffsets(ratio, distanceMultiplier) {
  // window.debug.innerText = ratio

  angle += angleIncrement * ratio
  angle %= TWO_PI
  main.style.setProperty(
    '--moveX',
    distanceMultiplier * offsetBase * Math.cos(angle) + 'px'
  )
  main.style.setProperty(
    '--moveY',
    distanceMultiplier * offsetBase * Math.sin(angle) + 'px'
  )
  // await delay(1000)
}
