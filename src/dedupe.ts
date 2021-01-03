import { Plugin, resolvePackageData, resolvePackageEntry } from 'vite'
import { join } from 'path'
import debug from 'debug'

const log = debug('vite:dedupe')

export default (names: string[]): Plugin => {
  const resolved: { [name: string]: string } = {}
  const reversed: { [resolved: string]: string } = {}
  return {
    name: 'vite:dedupe',
    enforce: 'pre',
    config(vite) {
      const root = vite.root || process.cwd()
      names.forEach(name => {
        const pkg = resolvePackageData(name, root)
        const entry = pkg && resolvePackageEntry(name, pkg)
        if (entry) {
          resolved[name] = entry
          reversed[entry] = name
        } else {
          log(`cannot find "${name}" from project root`)
        }
      })

      const alias = vite.alias
      if (Array.isArray(alias)) {
        vite.alias = alias.concat(
          names.map(name => ({ find: name, replacement: resolved[name] }))
        )
      } else {
        vite.alias = { ...alias, ...resolved }
      }
    },
    configureServer(server) {
      const { optimizeCacheDir } = server.config
      if (optimizeCacheDir)
        server.httpServer.once('listening', () => {
          const data = server.optimizeDepsMetadata
          if (!data) return

          // redirect to the optimized version
          this.resolveId = function (id) {
            const name = reversed[id]
            if (name && data.map[name]) {
              return join(optimizeCacheDir, data.map[name])
            }
          }
        })
    },
  }
}
