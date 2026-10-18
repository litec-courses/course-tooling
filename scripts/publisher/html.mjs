import path from 'node:path'

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function normalizeBase(value) {
  return `/${value.split('/').filter(Boolean).join('/')}${value === '/' ? '' : '/'}`
}

export function resourceExtension(resource) {
  return resource.directory ? '.zip' : path.extname(resource.file).toLowerCase()
}

export function renderPage({ base, content, copyright, description, footer, language = 'de', robotsMeta = '', title }) {
  const publicUrl = relativePath => `${base}${relativePath.replace(/^\/+/, '')}`
  const copyrightLine = copyright
    ? `<p class="copyright">© ${copyright.year} ${escapeHtml(copyright.holders.join(', '))}. ${escapeHtml(copyright.notice)}</p>`
    : ''

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  ${robotsMeta}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" type="image/png" href="${publicUrl('assets/litec-icon.png')}">
  <link rel="stylesheet" href="${publicUrl('styles.css')}">
</head>
<body>
  <header>
    <img src="${publicUrl('assets/litec-icon.png')}" alt="LiTec">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description || '')}</p>
    </div>
  </header>
  <main>${content}
  </main>
  <footer>
    <div class="footer-content">
      <p>${escapeHtml(footer)}</p>
      ${copyrightLine}
    </div>
  </footer>
</body>
</html>`
}

export function renderIndex(config, base, robotsMeta) {
  const publicUrl = relativePath => `${base}${relativePath.replace(/^\/+/, '')}`
  const labels = config.labels

  function renderUnit(unit) {
    const actions = []
    if (unit.slides) {
      actions.push(`<a class="button" href="${publicUrl(`slides/${unit.slug}/`)}">${escapeHtml(labels.openSlides)}</a>`)
      actions.push(`<a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-folien.pdf`)}" download>${escapeHtml(labels.downloadSlides)}</a>`)
    }
    if (unit.handout)
      actions.push(`<a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-begleitblatt.md`)}" download>${escapeHtml(labels.downloadHandoutMarkdown)}</a>`)
    for (const [resourceIndex, resource] of (unit.resources || []).entries()) {
      const extension = resourceExtension(resource)
      actions.push(`<a class="button secondary" href="${publicUrl(`downloads/${unit.slug}-resource-${resourceIndex + 1}${extension}`)}">${escapeHtml(resource.title)}</a>`)
    }

    return `
      <article>
        <h3>${escapeHtml(unit.title)}</h3>
        <div class="actions">${actions.join('\n          ')}</div>
      </article>`
  }

  const sections = config.sections.map(section => `
    <section class="topic-section">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : ''}
      <div class="units">${section.units.map(renderUnit).join('')}
      </div>
    </section>`).join('')

  return renderPage({
    base,
    content: `
    <div aria-label="${escapeHtml(labels.units)}">${sections}
    </div>`,
    copyright: config.course.copyright,
    description: config.course.description,
    footer: labels.footer,
    language: config.language,
    robotsMeta,
    title: config.course.title,
  })
}
