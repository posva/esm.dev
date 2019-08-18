export function addTapListener(
  listener: (event: TouchEvent | PointerEvent | MouseEvent) => void
) {
  if ('PointerEvent' in window)
    document.body.addEventListener('pointerdown', listener)
  else document.body.addEventListener('mousedown', listener)
  // touch devices
  document.body.addEventListener('touchstart', listener)
}
