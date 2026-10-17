#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const courseRoot = path.resolve(process.env.COURSE_ROOT || process.cwd())
const configPath = resolveCoursePath(process.env.PUBLISH_CONFIG || 'lectures/publish.yml', 'PUBLISH_CONFIG')
const dist = resolveCoursePath(process.env.PUBLISH_OUTPUT || 'dist', 'PUBLISH_OUTPUT')
const base = normalizeBase(process.env.PAGES_BASE || '/')
const theme = process.env.SLIDEV_THEME
const skipPdf = process.argv.includes('--skip-pdf')
const robotsMeta = '<meta name="robots" content="noindex, nofollow, noarchive">'

function resolveCoursePath(relativePath, label) {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]+/).includes('..'))
    throw new Error(`${label} must be a relative path within the course repository.`)
  return path.join(courseRoot, relativePath)
}

function normalizeBase(value) {
  return `/${value.split('/').filter(Boolean).join('/')}${value === '/' ? '' : '/'}`
}

function publicUrl(relativePath) {
  return `${base}${relativePath.replace(/^\/+/, '')}`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
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

async function assertCourseFile(relativePath, label) {
  const filePath = resolveCoursePath(relativePath, label)
  await access(filePath)
  return filePath
}

async function loadConfig() {
  const config = YAML.parse(await readFile(configPath, 'utf8'))
  const requiredLabels = [
    'openSlides',
    'downloadSlides',
    'downloadHandoutMarkdown',
    'units',
    'footer',
  ]

  if (!config?.course?.title || !config?.labels)
    throw new Error('The publish config requires course.title and labels.')
  for (const label of requiredLabels) {
    if (!config.labels[label])
      throw new Error(`The publish config requires labels.${label}.`)
  }

  if (!Array.isArray(config.sections) && !Array.isArray(config.units))
    throw new Error('The publish config requires sections or units.')

  const sections = Array.isArray(config.sections)
    ? config.sections
    : [{ title: config.labels.units, units: config.units }]
  const slugs = new Set()
  for (const [sectionIndex, section] of sections.entries()) {
    if (!section.title || !Array.isArray(section.units))
      throw new Error(`Section ${sectionIndex + 1} requires title and units.`)
    for (const unit of section.units) {
      if (!unit.slug?.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) || slugs.has(unit.slug))
        throw new Error(`Invalid or duplicate slug: ${unit.slug}`)
      if (!unit.title)
        throw new Error(`Unit ${unit.slug} requires a title.`)
      if (unit.resources !== undefined && !Array.isArray(unit.resources))
        throw new Error(`Unit ${unit.slug} resources must be an array.`)
      const resources = unit.resources || []
      if (!unit.slides && !unit.handout && resources.length === 0)
        throw new Error(`Unit ${unit.slug} requires slides, a handout, or resources.`)
      slugs.add(unit.slug)
      if (unit.slides)
        await assertCourseFile(unit.slides, `${unit.slug}.slides`)
      if (unit.handout)
        await assertCourseFile(unit.handout, `${unit.slug}.handout`)
      for (const [resourceIndex, resource] of resources.entries()) {
        if (!resource?.title || !resource?.file)
          throw new Error(`Resource ${resourceIndex + 1} in unit ${unit.slug} requires title and file.`)
        await assertCourseFile(resource.file, `${unit.slug}.resources[${resourceIndex}]`)
      }
    }
  }
  config.sections = sections
  return config
}

async function buildDeck(source, slug, pdfName) {
  const deckOut = path.join(dist, 'slides', slug)
  const deckBase = publicUrl(`slides/${slug}/`)
  await runSlidev(['build', source, '--out', deckOut, '--base', deckBase, '--without-notes'])
  await addRobotsMeta(path.join(deckOut, 'index.html'))
  if (!skipPdf)
    await runSlidev(['export', source, '--output', path.join(dist, 'downloads', pdfName), '--with-toc'])
}

async function addRobotsMeta(filePath) {
  const html = await readFile(filePath, 'utf8')
  if (html.includes('name="robots"'))
    return
  if (!/<head(?:\s[^>]*)?>/i.test(html))
    throw new Error(`Cannot add robots metadata to ${filePath}: missing <head>.`)
  await writeFile(filePath, html.replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n  ${robotsMeta}`))
}

function renderUnit(unit, labels) {
  const actions = []
  if (unit.slides) {
    actions.push(`<a class="button" href="${publicUrl(`slides/${unit.slug}/`)}">${escapeHtml(labels.openSlides)}</a>`)
    actions.push(`<a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-folien.pdf`)}" download>${escapeHtml(labels.downloadSlides)}</a>`)
  }
  if (unit.handout)
    actions.push(`<a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-begleitblatt.md`)}" download>${escapeHtml(labels.downloadHandoutMarkdown)}</a>`)
  for (const [resourceIndex, resource] of (unit.resources || []).entries()) {
    const extension = path.extname(resource.file).toLowerCase()
    actions.push(`<a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-resource-${resourceIndex + 1}${extension}`)}">${escapeHtml(resource.title)}</a>`)
  }

  return `
      <article>
        <h3>${escapeHtml(unit.title)}</h3>
        <div class="actions">${actions.join('\n          ')}</div>
      </article>`
}

function renderIndex(config) {
  const labels = config.labels
  const sections = config.sections.map(section => `
    <section class="topic-section">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : ''}
      <div class="units">${section.units.map(unit => renderUnit(unit, labels)).join('')}
      </div>
    </section>`).join('')

  return `<!doctype html>
<html lang="${escapeHtml(config.language || 'de')}">
<head>
  <meta charset="utf-8">
  ${robotsMeta}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(config.course.title)}</title>
  <link rel="icon" type="image/png" href="${publicUrl('assets/litec-icon.png')}">
  <link rel="stylesheet" href="${publicUrl('styles.css')}">
</head>
<body>
  <header>
    <img src="${publicUrl('assets/litec-icon.png')}" alt="LiTec">
    <div>
      <h1>${escapeHtml(config.course.title)}</h1>
      <p>${escapeHtml(config.course.description || '')}</p>
    </div>
  </header>
  <main>
    <div aria-label="${escapeHtml(labels.units)}">${sections}
    </div>
    <footer>${escapeHtml(labels.footer)}</footer>
  </main>
</body>
</html>`
}

async function main() {
  await access(path.join(courseRoot, 'node_modules/@slidev/cli/bin/slidev.mjs'))
  const config = await loadConfig()
  await rm(dist, { recursive: true, force: true })
  await mkdir(path.join(dist, 'downloads'), { recursive: true })

  for (const section of config.sections) {
    for (const unit of section.units) {
      if (unit.slides)
        await buildDeck(unit.slides, unit.slug, `${unit.slug}-folien.pdf`)
      if (unit.handout) {
        await cp(
          resolveCoursePath(unit.handout, `${unit.slug}.handout`),
          path.join(dist, 'downloads', `${unit.slug}-begleitblatt.md`),
        )
      }
      for (const [resourceIndex, resource] of (unit.resources || []).entries()) {
        const extension = path.extname(resource.file).toLowerCase()
        await cp(
          resolveCoursePath(resource.file, `${unit.slug}.resources[${resourceIndex}]`),
          path.join(dist, 'downloads', `${unit.slug}-resource-${resourceIndex + 1}${extension}`),
        )
      }
    }
  }

  await cp(path.join(toolRoot, 'styles/pages.css'), path.join(dist, 'styles.css'))
  await mkdir(path.join(dist, 'assets'), { recursive: true })
  await cp(path.join(toolRoot, 'assets/litec-icon.png'), path.join(dist, 'assets/litec-icon.png'))
  await writeFile(path.join(dist, 'index.html'), renderIndex(config))
  await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
  await writeFile(path.join(dist, '.nojekyll'), '')
  console.log(`GitHub Pages output created: ${dist}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
