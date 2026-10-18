import { escapeHtml, renderPage } from './html.mjs'

export function renderPortal(config, base, robotsMeta) {
  const sections = config.sections.map(section => {
    const entries = section.entries.length > 0
      ? `<div class="units">${section.entries.map(entry => `
        <article>
          <h3>${escapeHtml(entry.title)}</h3>
          ${entry.description ? `<p class="section-description">${escapeHtml(entry.description)}</p>` : ''}
          <div class="actions"><a class="button" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.linkTitle || config.labels.openEntry)}</a></div>
        </article>`).join('')}
      </div>`
      : `<p class="empty-section">${escapeHtml(config.labels.emptySection)}</p>`

    return `
    <section class="topic-section">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : ''}
      ${entries}
    </section>`
  }).join('')

  return renderPage({
    base,
    content: sections,
    copyright: config.site.copyright,
    description: config.site.description,
    footer: config.labels.footer,
    language: config.language,
    robotsMeta,
    title: config.site.title,
  })
}
