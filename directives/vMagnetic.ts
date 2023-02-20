import { Directive, effectScope, EffectScope } from 'vue'
import { useEventListener, useMouse as _useMouse } from '@vueuse/core'
import { useSpring as _useSpring } from 'vue-use-spring'

let scope: EffectScope | undefined

function getEffectScope() {
  return scope || (scope = effectScope(true))
}

function useMouse(el: HTMLElement) {
  return getEffectScope().run(() => {
    const target = reactive(_useMouse())
    const mouse = _useSpring({ x: target.x, y: target.y })

    watch(
      target,
      ({ x, y }) => {
        mouse.x = x
        mouse.y = y
      },
      { deep: true }
    )

    return mouse
  })!
}

export interface VMagneticValue {
  maxDistance?: number
}

export interface MagneticElement extends HTMLElement {
  __scope: EffectScope
  __children: HTMLElement[]
}

const noop = () => {}
let lastStop = noop

export const vMagnetic: Directive<MagneticElement, VMagneticValue | undefined> =
  {
    mounted(el, binding) {
      const options: Required<VMagneticValue> = Object.assign(
        {
          maxDistance: 50,
        },
        binding.arg
      )

      const scope = effectScope(true)
      el.__scope = scope
      el.__children = []

      const trail = createCopyText(el)
      trail.style.color = 'rgba(var(--blue), 0.5)'
      trail.style.zIndex = '10'

      let isMagnetized = false
      const initialRect = el.getBoundingClientRect()
      const center = {
        x: initialRect.x + initialRect.width / 2,
        y: initialRect.y + initialRect.height / 2,
      }

      const mouse = getEffectScope().run(() => {
        const target = reactive(_useMouse())
        const mouse = _useSpring({ ...center })
        const trailPos = _useSpring({ ...center })

        watch(
          target,
          ({ x, y }) => {
            if (!isMagnetized) return
            mouse.x = x
            mouse.y = y
          },
          { deep: true }
        )

        watch(
          mouse,
          ({ x, y }) => {
            if (!isMagnetized) return
            trailPos.x = x
            trailPos.y = y
          },
          { deep: true }
        )

        watch(
          trailPos,
          ({ x, y }) => {
            trail.style.transform = `translate(
                ${0.7 * (x - center.x)}px, ${
              0.7 * (y - center.y)
            }px) scale(1.2)`
          },
          { deep: true }
        )

        return mouse
      })!

      let stopWatcher = noop
      function magnetize() {
        // el.style.position = 'absolute'
        // el.style.top = '0'
        // el.style.left = '0'

        lastStop()
        lastStop = stop
        stopWatcher()
        isMagnetized = true
        trail.style.opacity = '1'
        stopWatcher = scope.run(() =>
          watch(
            mouse,
            ({ x, y }) => {
              if (
                isFurtherFromBBoxThan(
                  { x, y },
                  initialRect,
                  options.maxDistance
                )
              ) {
                stop()
                return
              }

              // const p = Math.log(1 + (200 * dist) / options.maxDistance) / 5
              // TODO: wrong distance, should be from center
              const p = distance({ x, y }, center) / options.maxDistance

              el.style.transform = `translate(
                ${0.7 * (x - center.x)}px, ${0.7 * (y - center.y)}px)`
            },
            { deep: true }
          )
        )!
      }

      function stop() {
        isMagnetized = false
        // reset position smoothly
        mouse.x = center.x
        mouse.y = center.y
        trail.style.opacity = '0'
        // el.style.position = ''
      }

      scope.run(() => useEventListener(el, 'mouseenter', magnetize))

      scope.run(() => {
        onScopeDispose(() => {
          // remove elements
          el.__children.forEach((child) => {
            child.remove()
          })

          console.log('out')

          // @ts-expect-error: not optional
          delete el.__children
        })
      })
    },

    unmounted(el, binding) {
      if (el.__scope) {
        el.__scope.stop()
        // @ts-expect-error: __scope is not optional, but this avoid potential memory leaks
        delete el.__scope
      }
    },
  }

function createCopyText(el: MagneticElement) {
  const copyEl = document.createElement(el.tagName)
  copyEl.innerHTML = el.innerHTML
  copyEl.style.pointerEvents = 'none'

  const rect = el.getBoundingClientRect()
  copyEl.style.position = 'absolute'
  copyEl.style.top = rect.top + 'px'
  copyEl.style.left = rect.left + 'px'
  copyEl.style.opacity = '0'
  copyEl.classList.add('haha')

  copyEl.style.transition = 'opacity 500ms linear'

  document.body.appendChild(copyEl)

  el.__children.push(copyEl)

  return copyEl
}

interface Point {
  x: number
  y: number
}

function isFurtherThan(p1: Point, p2: Point, distance: number) {
  // console.log(Math.abs((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 - distance ** 2))
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 > distance ** 2
  // return Math.abs(Math.hypot(p1.x - p2.x, p1.y - p2.y) - distance) < DELTA
}

function distanceFromBBox(p1: Point, box: DOMRect) {
  if (p1.x >= box.left && p1.x <= box.right) {
    return Math.abs(
      Math.min(Math.abs(p1.y - box.top), Math.abs(p1.y - box.bottom))
    )
  } else if (p1.y >= box.top && p1.y <= box.bottom) {
    return Math.abs(
      Math.min(Math.abs(p1.x - box.left), Math.abs(p1.x - box.right))
    )
  }

  const p2: Point = {
    x: p1.x <= box.left ? box.left : box.right,
    y: p1.y <= box.top ? box.top : box.bottom,
  }

  return distance(p1, p2)
}

function isFurtherFromBBoxThan(p1: Point, box: DOMRect, distance: number) {
  if (p1.x >= box.left && p1.x <= box.right) {
    return (
      Math.min(Math.abs(p1.y - box.top), Math.abs(p1.y - box.bottom)) > distance
    )
  } else if (p1.y >= box.top && p1.y <= box.bottom) {
    return (
      Math.min(Math.abs(p1.x - box.left), Math.abs(p1.x - box.right)) > distance
    )
  }

  const p2: Point = {
    x: p1.x <= box.left ? box.left : box.right,
    y: p1.y <= box.top ? box.top : box.bottom,
  }

  return isFurtherThan(p1, p2, distance)
}

function distance(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}
