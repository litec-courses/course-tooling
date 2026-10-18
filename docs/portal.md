# Publishing a Course Portal

The portal publisher creates an organization-level index using the same page shell, styles, assets, footer, and search-engine directives as course landing pages. It adds `noindex`, `nofollow`, and `noarchive` metadata and a supplemental `robots.txt` with `Disallow: /`. These directives do not restrict access; anyone with the URL can still open and share the portal.

## Portal configuration

Create `portal.yml` in the portal repository:

```yaml
site:
  title: LiTec Courses
  description: Öffentliche Unterrichtsmaterialien nach Jahrgang
  copyright:
    holders:
      - Vorname Nachname
    year: 2026
    notice: Alle Rechte vorbehalten.

labels:
  openEntry: Kurs öffnen
  emptySection: Noch keine veröffentlichten Kurse.
  footer: Öffentlich freigegebene Unterrichtsmaterialien.

sections:
  - title: 1. Jahrgang
    entries: []
  - title: 2. Jahrgang
    entries: []
  - title: 3. Jahrgang
    entries:
      - title: MEDT3
        description: Medientechnik
        url: https://litec-courses.github.io/MEDT3/
      - title: SYT3
        description: Systemtechnik
        url: https://litec-courses.github.io/SYT3/
  - title: 4. Jahrgang
    entries: []
  - title: 5. Jahrgang
    entries: []
```

Sections remain visible when their `entries` array is empty. Every entry requires an absolute HTTPS URL without embedded credentials. Use `linkTitle` on an entry only when its button should differ from `labels.openEntry`.

## Package and workflow

Expose the portal publisher as the Pages build command:

```json
{
  "scripts": {
    "pages:build": "litec-course-portal"
  },
  "devDependencies": {
    "slidev-theme-litec": "github:litec-courses/course-tooling#v0.9.1"
  }
}
```

An organization site uses `/` instead of a repository-name base path and does not need Chromium:

```yaml
jobs:
  pages:
    uses: litec-courses/course-tooling/.github/workflows/publish-pages.yml@v0.9.1
    with:
      config-path: portal.yml
      base-path: /
      install-chromium: false
```

The repository must be named after the organization site, for example `litec-courses.github.io`.
