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
    'course',
    'openCourseSlides',
    'downloadCourseSlides',
    'openSlides',
    'downloadSlides',
    'downloadHandoutMarkdown',
    'units',
    'footer',
  ]

  if (!config?.course?.title || !config?.course?.slides || !config?.labels || !Array.isArray(config.units))
    throw new Error('The publish config requires course.title, course.slides, labels, and units.')
  for (const label of requiredLabels) {
    if (!config.labels[label])
      throw new Error(`The publish config requires labels.${label}.`)
  }

  const slugs = new Set()
  await assertCourseFile(config.course.slides, 'course.slides')
  for (const unit of config.units) {
    if (!unit.slug?.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) || slugs.has(unit.slug))
      throw new Error(`Invalid or duplicate slug: ${unit.slug}`)
    if (!unit.title || !unit.slides || !unit.handout)
      throw new Error(`Unit ${unit.slug} requires title, slides, and handout.`)
    slugs.add(unit.slug)
    await assertCourseFile(unit.slides, `${unit.slug}.slides`)
    await assertCourseFile(unit.handout, `${unit.slug}.handout`)
  }
  return config
}

async function buildDeck(source, slug, pdfName) {
  const deckOut = path.join(dist, 'slides', slug)
  const deckBase = publicUrl(`slides/${slug}/`)
  await runSlidev(['build', source, '--out', deckOut, '--base', deckBase, '--without-notes'])
  await runSlidev(['export', source, '--output', path.join(dist, 'downloads', pdfName), '--with-toc'])
}

function renderIndex(config) {
  const labels = config.labels
  const units = config.units.map(unit => `
    <article>
      <h2>${escapeHtml(unit.title)}</h2>
      <div class="actions">
        <a class="button" href="${publicUrl(`slides/${unit.slug}/`)}">${escapeHtml(labels.openSlides)}</a>
        <a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-folien.pdf`)}" download>${escapeHtml(labels.downloadSlides)}</a>
        <a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-begleitblatt.md`)}" download>${escapeHtml(labels.downloadHandoutMarkdown)}</a>
      </div>
    </article>`).join('')

  return `<!doctype html>
<html lang="${escapeHtml(config.language || 'de')}">
<head>
  <meta charset="utf-8">
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
    <section class="course">
      <h2>${escapeHtml(labels.course)}</h2>
      <div class="actions">
        <a class="button" href="${publicUrl('slides/kurs/')}">${escapeHtml(labels.openCourseSlides)}</a>
        <a class="button secondary" href="${publicUrl('downloads/kurs-folien.pdf')}" download>${escapeHtml(labels.downloadCourseSlides)}</a>
      </div>
    </section>
    <section class="units" aria-label="${escapeHtml(labels.units)}">${units}
    </section>
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

  await buildDeck(config.course.slides, 'kurs', 'kurs-folien.pdf')
  for (const unit of config.units) {
    await buildDeck(unit.slides, unit.slug, `${unit.slug}-folien.pdf`)
    await cp(
      resolveCoursePath(unit.handout, `${unit.slug}.handout`),
      path.join(dist, 'downloads', `${unit.slug}-begleitblatt.md`),
    )
  }

  await cp(path.join(toolRoot, 'styles/pages.css'), path.join(dist, 'styles.css'))
  await mkdir(path.join(dist, 'assets'), { recursive: true })
  await cp(path.join(toolRoot, 'assets/litec-icon.png'), path.join(dist, 'assets/litec-icon.png'))
  await writeFile(path.join(dist, 'index.html'), renderIndex(config))
  await writeFile(path.join(dist, '.nojekyll'), '')
  console.log(`GitHub Pages output created: ${dist}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
