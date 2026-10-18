#!/usr/bin/env node

import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCoursePaths } from './publisher/config.mjs'
import { normalizeBase } from './publisher/html.mjs'
import { loadPortalConfig } from './publisher/portal-config.mjs'
import { renderPortal } from './publisher/portal-html.mjs'

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const portalRoot = path.resolve(process.env.COURSE_ROOT || process.cwd())
const paths = createCoursePaths(portalRoot)
const configPath = paths.resolve(process.env.PUBLISH_CONFIG || 'portal.yml', 'PUBLISH_CONFIG')
const dist = paths.resolve(process.env.PUBLISH_OUTPUT || 'dist', 'PUBLISH_OUTPUT')
const base = normalizeBase(process.env.PAGES_BASE || '/')
const robotsMeta = '<meta name="robots" content="noindex, nofollow, noarchive">'

async function main() {
  const config = await loadPortalConfig(configPath)
  await rm(dist, { recursive: true, force: true })
  await mkdir(path.join(dist, 'assets'), { recursive: true })
  await cp(path.join(toolRoot, 'styles/pages.css'), path.join(dist, 'styles.css'))
  await cp(path.join(toolRoot, 'assets/litec-icon.png'), path.join(dist, 'assets/litec-icon.png'))
  await writeFile(path.join(dist, 'index.html'), renderPortal(config, base, robotsMeta))
  await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
  await writeFile(path.join(dist, '.nojekyll'), '')
  console.log(`GitHub Pages portal created: ${dist}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
