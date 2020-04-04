const colorMap = new Map<string, string>()

const RGB_RE = /^rgba?\((\d+), *(\d+), *(\d+)\)/
export function getHexColorVariable(variable: string): number {
  const rgb = getColorVariable(variable)
  const matches = rgb.match(RGB_RE)
  if (!matches || matches.length < 4) return 0

  return parseInt(
    matches
      .slice(1)
      .map((n) => Number(n).toString(16))
      .join(''),
    16
  )
}

export function getColorVariable(variable: string): string {
  // allow hex colors
  if (variable.startsWith('#')) return variable

  const savedColor = colorMap.get(variable)
  if (savedColor) return savedColor

  const el = document.createElement('span')
  el.style.color = `rgb(var(--${variable}))`
  el.style.visibility = 'hidden'
  el.style.display = 'none'
  document.body.append(el)
  const { color } = window.getComputedStyle(el)
  document.body.removeChild(el)
  colorMap.set(variable, color || '')

  return color || ''
}

let mql: MediaQueryList
let mqlListeners: MqlListener[] = []

type MqlListener = (event: MediaQueryListEvent) => any

export function onColorChange(listener: MqlListener): () => void {
  // lazily create the object because it was causing errors on Safari on totally different
  // dependencies being undefined. Webpack seems to duplicate the file and include it in multiple files
  if (!mql) {
    mql = window.matchMedia('(prefers-color-scheme: light)')
    // old browsers need this one instead of the newer addEventListener
    mql.addListener((event) => {
      mqlListeners.forEach((listener) => listener(event))
    })
  }
  mqlListeners.push(listener)
  return () => {
    const index = mqlListeners.indexOf(listener)
    if (index > -1) mqlListeners.splice(index, 1)
  }
}

// reset color check if the scheme changes
onColorChange(() => {
  colorMap.clear()
})
