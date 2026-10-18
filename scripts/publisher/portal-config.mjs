import { readFile } from 'node:fs/promises'
import YAML from 'yaml'
import { validateCopyright } from './config.mjs'

function assertHttpsUrl(value, label) {
  let url
  try {
    url = new URL(value)
  }
  catch {
    throw new Error(`${label} must be an absolute HTTPS URL.`)
  }
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error(`${label} must be an absolute HTTPS URL without credentials.`)
}

export async function loadPortalConfig(configPath) {
  const config = YAML.parse(await readFile(configPath, 'utf8'))
  const requiredLabels = ['openEntry', 'emptySection', 'footer']

  if (!config?.site?.title || !config?.labels)
    throw new Error('The portal config requires site.title and labels.')
  validateCopyright(config.site.copyright, 'site.copyright')
  for (const label of requiredLabels) {
    if (!config.labels[label])
      throw new Error(`The portal config requires labels.${label}.`)
  }
  if (!Array.isArray(config.sections) || config.sections.length === 0)
    throw new Error('The portal config requires a non-empty sections array.')

  for (const [sectionIndex, section] of config.sections.entries()) {
    if (!section.title || !Array.isArray(section.entries))
      throw new Error(`Section ${sectionIndex + 1} requires title and entries.`)
    for (const [entryIndex, entry] of section.entries.entries()) {
      const label = `sections[${sectionIndex}].entries[${entryIndex}]`
      if (!entry?.title)
        throw new Error(`${label} requires a title.`)
      assertHttpsUrl(entry.url, `${label}.url`)
    }
  }

  return config
}
