import './index.css'
import { rotateOffsets } from './links'
// import './physics'

let rafId
function update() {
  rafId = requestAnimationFrame(elapsed => {
    stepper(elapsed)
    update()
  })
}

// For better dev
if (module.hot) {
  module.hot.accept('./links.js', () => {
    cancelAnimationFrame(rafId)
    update()
  })
}

update()

let lastElapsed = 0
const BASE_DELTA = 1000 / 60 // 1s / 60 frames
let lastDelta = BASE_DELTA

function stepper(elapsed) {
  lastDelta = elapsed - lastElapsed
  lastElapsed = elapsed
  const ratio = lastDelta / BASE_DELTA

  rotateOffsets(ratio)
}
