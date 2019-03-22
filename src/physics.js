import Matter from 'matter-js'

// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies

// create an engine
var engine = Engine.create()

let ratio = window.innerWidth / window.innerHeight

// create a renderer
var render = Render.create({
  canvas: document.getElementById('physics'),
  options: {
    width: 400,
    height: 400 / ratio,
  },
  engine,
})

window.addEventListener('resize', () => {
  ratio = window.innerWidth / window.innerHeight
  return
  render.options.width = window.innerWidth
  render.options.height = window.innerHeight
  // render.bounds = Matter.Bounds.create(Matter.Vertices.create())
})

document.addEventListener('click', event => {
  debugger
})

// create two boxes and a ground
var boxA = Bodies.rectangle(200, 200, 30, 30)
var boxB = Bodies.rectangle(220, 50, 30, 30)
var ground = Bodies.rectangle(200, 300, 310, 20, { isStatic: true })

// add all of the bodies to the world
World.add(engine.world, [boxA, boxB, ground])

// run the engine
Engine.run(engine)

// run the renderer
Render.run(render)
