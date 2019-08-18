import './index.css'
import { rotateOffsets } from './links'
// import './physics'

const possibleExperiments = ['windmill-problem', 'maze', 'coast']
const experimentId =
  process.env.NODE_ENV === 'production'
    ? Math.floor(Math.random() * possibleExperiments.length)
    : possibleExperiments.length - 1

const experiment = () =>
  import(`./visual-experiments/${possibleExperiments[experimentId]}.ts`)

let rafId
function update() {
  rafId = requestAnimationFrame(elapsed => {
    stepper(elapsed)
    update()
  })
}

// For better dev
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept('./links.js', () => {
    cancelAnimationFrame(rafId)
    update()
  })
}

document.querySelectorAll('a').forEach(link => {
  link.dataset['text'] = link.innerText
})

let experimentRender: ((...args: any[]) => void) | null = null

experiment().then(module => {
  experimentRender = module.render
})

update()

let lastElapsed = 0
const BASE_DELTA = 1000 / 60 // 1s / 60 frames
let lastDelta = BASE_DELTA

function stepper(elapsed) {
  lastDelta = elapsed - lastElapsed
  lastElapsed = elapsed
  const ratio = lastDelta / BASE_DELTA

  if (Date.now() - lastMove > 200) {
    mouseTravel = Math.max(0, mouseTravel - ratio * 70)
  }

  // only on production because we add css variables on root and it's hard to debug
  if (process.env.NODE_ENV === 'production')
    rotateOffsets(ratio, Math.max(1, Math.min(mouseTravel / 200, 10)))

  experimentRender && experimentRender(ratio)
}

const lastMousePos = [-1, -1]
let mouseTravel = 0
let lastMove = 0
document.body.addEventListener('mousemove', ({ pageX, pageY }) => {
  if (lastMousePos[0] > -1)
    mouseTravel += Math.max(
      Math.abs(pageX - lastMousePos[0]),
      Math.abs(pageY - lastMousePos[1])
    )
  lastMousePos[0] = pageX
  lastMousePos[1] = pageY
  lastMove = Date.now()
})
