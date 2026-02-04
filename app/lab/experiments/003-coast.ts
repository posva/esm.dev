import { nanoid } from 'nanoid'
import { debounce } from 'lodash-es'
import { resetCanvasCheck, ensureCanvasWithSize } from '../utils/screen'
import { getColorVariable, onColorChange } from '../utils/colors'
import { generateMaze, solveMaze, simplifyPath, type Context, setRandomizer } from './002-maze'
import { addTapListener } from '../utils/events'
import { createRandomizer } from '../utils/random'

let isListening = false

let _context: Context | null = null

function getContext(): Context | null {
  if (_context) return _context
  resetCanvasCheck()

  const [canvasEl, size] = ensureCanvasWithSize()
  const offset = { x: 1, y: 1 }
  const cellSize = 1.5
  // console.time('Maze Generation')

  // convert sizes from px to cells
  const width = Math.floor((size.x - offset.x * 2) / cellSize)
  const height = Math.floor((size.y - offset.y * 2) / cellSize)

  // too small
  if (width < 3 || height < 3) return null

  const seed = (!isListening && window.location.hash.slice(1)) || nanoid()
  console.log(`🖼 ${width}x${height}\n🌱 "${seed}"`)
  const random = createRandomizer(seed)
  setRandomizer(random)

  const tree = generateMaze(width, height)
  let solutionUnoptimized = solveMaze(tree, { x: 0, y: 0 }, { x: width - 1, y: height - 1 })

  // add a small offset outside of the maze to make it look better
  solutionUnoptimized.unshift({ x: 0, y: -1 })
  solutionUnoptimized.push({ x: tree.width - 1, y: tree.height })

  const solution = simplifyPath(solutionUnoptimized)

  if (!isListening) {
    isListening = true
    addTapListener(() => {
      if (window.location.hash) window.location.hash = ''
      _context = null
    })
    window.addEventListener(
      'resize',
      debounce(() => {
        _context = null
        getContext()
      }, 200),
    )

    onColorChange(() => {
      _context!.state = 'start'
    })
  }

  canvasEl.width = size.x * window.devicePixelRatio
  canvasEl.height = size.y * window.devicePixelRatio
  const ctx = canvasEl.getContext('2d')!
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  return (_context = {
    tree,
    solution,
    width,
    height,
    state: 'start',
    direction: 'y',
    position: { ...solution[0] },
    remaining: solution[1].y - solution[0].y,
    nextPoint: 1,
    random,

    ctx,
    cellSize,
    offset,
  })
}

export function render() {
  const [_canvasEl, size] = ensureCanvasWithSize()

  const context = getContext()
  if (!context) return

  if (context.state === 'start') {
    const { offset, cellSize, ctx, solution } = context

    // clear
    ctx.fillStyle = getColorVariable('bgColor') === 'rgb(18, 19, 20)' ? 'black' : 'white'
    ctx.fillRect(0, 0, size.x, size.y)

    // draw the path that has been traversed already
    let point = solution[0]
    let x = offset.x + (point.x + 0.5) * cellSize
    let y = offset.y + (point.y + 0.5) * cellSize
    ctx.beginPath()
    // ctx.lineJoin = 'round'
    // ctx.lineCap = 'round'
    ctx.strokeStyle = getColorVariable('accent')
    ctx.fillStyle = getColorVariable('bgColor')
    ctx.moveTo(x, y)
    for (let i = 1; i < solution.length; i++) {
      point = solution[i]
      x = offset.x + (point.x + 0.5) * cellSize
      y = offset.y + (point.y + 0.5) * cellSize
      ctx.lineTo(x, y)
    }
    ctx.lineTo(x, y + 3)
    ctx.lineTo(-3, size.y + 3)
    ctx.lineTo(-3, -3)
    ctx.fill()
    ctx.stroke()

    context.state = 'end'
  }
}
