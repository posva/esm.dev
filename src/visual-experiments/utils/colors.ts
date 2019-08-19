const colorMap = new Map<string, string>()

export function getColorVariable(variable: string): string {
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
