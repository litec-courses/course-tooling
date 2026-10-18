#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { archiveDirectory } from './publisher/archive.mjs'
import { createCoursePaths, loadPublishConfig } from './publisher/config.mjs'
import { normalizeBase, renderIndex, resourceExtension } from './publisher/html.mjs'

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const courseRoot = path.resolve(process.env.COURSE_ROOT || process.cwd())
const paths = createCoursePaths(courseRoot)
const configPath = paths.resolve(process.env.PUBLISH_CONFIG || 'lectures/publish.yml', 'PUBLISH_CONFIG')
const dist = paths.resolve(process.env.PUBLISH_OUTPUT || 'dist', 'PUBLISH_OUTPUT')
const base = normalizeBase(process.env.PAGES_BASE || '/')
const theme = process.env.SLIDEV_THEME
const skipPdf = process.argv.includes('--skip-pdf')
const robotsMeta = '<meta name="robots" content="noindex, nofollow, noarchive">'

function publicUrl(relativePath) {
  return `${base}${relativePath.replace(/^\/+/, '')}`
}

function runSlidev(args) {
  const cli = path.join(courseRoot, 'node_modules/@slidev/cli/bin/slidev.mjs')
  const themeArgs = theme ? ['--theme', theme] : []
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args, ...themeArgs], {
      cwd: courseRoot,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Slidev exited with code ${code}.`)))
  })
}

async function addRobotsMeta(filePath) {
  const html = await readFile(filePath, 'utf8')
  if (html.includes('name="robots"'))
    return
  if (!/<head(?:\s[^>]*)?>/i.test(html))
    throw new Error(`Cannot add robots metadata to ${filePath}: missing <head>.`)
  await writeFile(filePath, html.replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n  ${robotsMeta}`))
}

async function buildDeck(source, slug) {
  const deckOut = path.join(dist, 'slides', slug)
  await runSlidev(['build', source, '--out', deckOut, '--base', publicUrl(`slides/${slug}/`), '--without-notes'])
  await addRobotsMeta(path.join(deckOut, 'index.html'))
  if (!skipPdf)
    await runSlidev(['export', source, '--output', path.join(dist, 'downloads', `${slug}-folien.pdf`), '--with-toc'])
}

async function publishResource(unit, resource, resourceIndex) {
  const resourceLabel = `${unit.slug}.resources[${resourceIndex}]`
  const output = path.join(
    dist,
    'downloads',
    `${unit.slug}-resource-${resourceIndex + 1}${resourceExtension(resource)}`,
  )
  if (resource.directory) {
    await archiveDirectory({
      courseRoot,
      relativeDirectory: resource.directory,
      directoryPath: await paths.assertDirectory(resource.directory, resourceLabel),
      outputPath: output,
      label: resourceLabel,
      resolveCoursePath: paths.resolve,
    })
  }
  else {
    await cp(paths.resolve(resource.file, resourceLabel), output)
  }
}

async function main() {
  await access(path.join(courseRoot, 'node_modules/@slidev/cli/bin/slidev.mjs'))
  const config = await loadPublishConfig(configPath, paths)
  await rm(dist, { recursive: true, force: true })
  await mkdir(path.join(dist, 'downloads'), { recursive: true })

  for (const section of config.sections) {
    for (const unit of section.units) {
      if (unit.slides)
        await buildDeck(unit.slides, unit.slug)
      if (unit.handout) {
        await cp(
          paths.resolve(unit.handout, `${unit.slug}.handout`),
          path.join(dist, 'downloads', `${unit.slug}-begleitblatt.md`),
        )
      }
      for (const [resourceIndex, resource] of (unit.resources || []).entries())
        await publishResource(unit, resource, resourceIndex)
    }
  }

  await cp(path.join(toolRoot, 'styles/pages.css'), path.join(dist, 'styles.css'))
  await mkdir(path.join(dist, 'assets'), { recursive: true })
  await cp(path.join(toolRoot, 'assets/litec-icon.png'), path.join(dist, 'assets/litec-icon.png'))
  await writeFile(path.join(dist, 'index.html'), renderIndex(config, base, robotsMeta))
  await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
  await writeFile(path.join(dist, '.nojekyll'), '')
  console.log(`GitHub Pages output created: ${dist}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
