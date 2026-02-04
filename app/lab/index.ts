export const EXPERIMENT_MODULES = import.meta.glob(`~/lab/experiments/*.ts`)

export function parseExperimentName(path: string) {
  const name = path.replace(/.*\/([^/]+?)\.ts/, '$1')
  return name
}

export const SKIP_LIST = ['004-crossing-lines']

export const experimentModuleList: Array<{
  name: string
  module: () => Promise<unknown>
}> = []
export const experimentModuleMap = Object.keys(EXPERIMENT_MODULES).reduce(
  (acc, path) => {
    if (!SKIP_LIST.includes(parseExperimentName(path))) {
      const parsedPath = parseExperimentName(path)
      acc[parsedPath] = EXPERIMENT_MODULES[path]
      experimentModuleList.push({
        name: parsedPath,
        module: EXPERIMENT_MODULES[path],
      })
    }
    return acc
  },
  {} as typeof EXPERIMENT_MODULES,
)

export const experimentNames = Object.keys(experimentModuleMap)
