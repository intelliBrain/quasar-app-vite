// Pre-render the app into static HTML.
// run `yarn generate` and then `dist/static` can be served as a static site.

import { readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import path from 'path'

import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const prerender = async (appDir: string) => {
  const toAbsolute = (p: string) => path.resolve(appDir, p)

  // const manifest = await import('dist/static/ssr-manifest.json')
  // const manifest = await import(toAbsolute('dist/static/ssr-manifest.json'))
  const manifest = require(toAbsolute('dist/static/ssr-manifest.json'))
  // const manifest = await import(resolve(appDir, 'dist', 'static', 'ssr-manifest.json'))
  // const template = fs.readFileSync(toAbsolute('dist/static/index.html'), 'utf-8')
  const template = readFileSync(toAbsolute('dist/static/index.html'), 'utf-8')
  // const template = readFileSync(resolve(appDir, 'dist', 'static', 'index.html'), 'utf-8')
  // const { render } = await import('dist/ssr/server/entry-server.js')
  const { render } = await import(toAbsolute('dist/ssr/server/entry-server.js'))
  // const { render } = await import(resolve(appDir, 'dist', 'ssr', 'entry-server.js'))

  // determine routes to pre-render from src/pages
  const routesToPrerender = readdirSync(toAbsolute('src/pages'))
    .map((file) => {
      const name = file.replace(/\.vue$/, '').toLowerCase()
      return name === 'home' ? `/` : `/${name}`
    })

    // pre-render each route...
    for (const url of routesToPrerender) {
      const ssrContext = {
        req: {
          headers: {}
        }
      }
      const [appHtml, preloadLinks] = await render(url, manifest, ssrContext)

      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, appHtml)

      // const filePath = resolve(appDir, 'dist', 'static', url === '/' ? '/index' : url, '.html')
      const filePath = `dist/static${url === '/' ? '/index' : url}.html`
      writeFileSync(toAbsolute(filePath), html)
      console.log('pre-rendered:', filePath)
    }

    // done, delete ssr manifest
    unlinkSync('dist/static/ssr-manifest.json')
}