import Matter from 'matter-js'

// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies

// create an engine
var engine = Engine.create()

// create a renderer
var render = Render.create({
  canvas: document.getElementById('physics'),
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  engine,
})

window.addEventListener('resize', () => {
  render.options.width = window.innerWidth
  render.options.height = window.innerHeight
  // render.bounds = Matter.Bounds.create(Matter.Vertices.create())
})

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80)
var boxB = Bodies.rectangle(450, 50, 80, 80)
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true })

// add all of the bodies to the world
World.add(engine.world, [boxA, boxB, ground])

// run the engine
Engine.run(engine)

// run the renderer
Render.run(render)
