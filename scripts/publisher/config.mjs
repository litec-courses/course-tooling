import { lstat, readFile } from 'node:fs/promises'
import path from 'node:path'
import YAML from 'yaml'

export function validateCopyright(copyright, label) {
  if (copyright === undefined)
    return
  if (!copyright || !Array.isArray(copyright.holders) || copyright.holders.length === 0
    || copyright.holders.some(holder => typeof holder !== 'string' || !holder.trim()))
    throw new Error(`${label}.holders must be a non-empty array of names.`)
  if (!Number.isInteger(copyright.year) || copyright.year < 1000 || copyright.year > 9999)
    throw new Error(`${label}.year must be a four-digit integer.`)
  if (typeof copyright.notice !== 'string' || !copyright.notice.trim())
    throw new Error(`${label}.notice must be a non-empty string.`)
}

export function createCoursePaths(courseRoot) {
  function resolve(relativePath, label) {
    if (!relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]+/).includes('..'))
      throw new Error(`${label} must be a relative path within the course repository.`)
    return path.join(courseRoot, relativePath)
  }

  async function assertFile(relativePath, label) {
    const filePath = resolve(relativePath, label)
    if (!(await lstat(filePath)).isFile())
      throw new Error(`${label} must reference a regular file.`)
    return filePath
  }

  async function assertDirectory(relativePath, label) {
    const directoryPath = resolve(relativePath, label)
    if (!(await lstat(directoryPath)).isDirectory())
      throw new Error(`${label} must reference a directory.`)
    return directoryPath
  }

  return { resolve, assertFile, assertDirectory }
}

export async function loadPublishConfig(configPath, paths) {
  const config = YAML.parse(await readFile(configPath, 'utf8'))
  const requiredLabels = ['openSlides', 'downloadSlides', 'downloadHandoutMarkdown', 'units', 'footer']

  if (!config?.course?.title || !config?.labels)
    throw new Error('The publish config requires course.title and labels.')
  validateCopyright(config.course.copyright, 'course.copyright')
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
        await paths.assertFile(unit.slides, `${unit.slug}.slides`)
      if (unit.handout)
        await paths.assertFile(unit.handout, `${unit.slug}.handout`)
      for (const [resourceIndex, resource] of resources.entries()) {
        const resourceLabel = `${unit.slug}.resources[${resourceIndex}]`
        if (!resource?.title || Boolean(resource.file) === Boolean(resource.directory))
          throw new Error(`Resource ${resourceIndex + 1} in unit ${unit.slug} requires title and exactly one of file or directory.`)
        if (resource.file)
          await paths.assertFile(resource.file, resourceLabel)
        else
          await paths.assertDirectory(resource.directory, resourceLabel)
      }
    }
  }

  config.sections = sections
  return config
}
