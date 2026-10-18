# LiTec Course Tooling

Shared, versioned tooling and infrastructure for LiTec Slidev courses.

It provides:

- the versioned `slidev-theme-litec` theme and course publisher
- a reusable GitHub Pages workflow
- shared infrastructure documentation
- immutable GitHub tags for reproducible course builds

The repository root is the installable Node package, so course repositories can pin a GitHub tag directly. Publishing to npm is not currently planned.

> [!WARNING]
> Exams, solutions, and speaker notes must not be published.

## Installation

Course repositories pin an immutable GitHub tag:

```json
{
  "devDependencies": {
    "slidev-theme-litec": "github:litec-courses/course-tooling#v0.8.0"
  }
}
```

Select the package by its full name in Slidev headmatter:

```yaml
---
theme: slidev-theme-litec
---
```

## Development

```bash
bun install --frozen-lockfile
bun run dev
bun run build
bun run export
```

`build` verifies the default 3:2 format and the 16:9 override. `export` creates PDFs for visual review.

## Repository root

The root is also the installable Slidev theme package. These files remain there because Node, Bun, Slidev, or repository tooling expects them at package level:

- `package.json` and `bun.lock`: package metadata and reproducible dependencies
- `global-top.vue` and `global-bottom.vue`: Slidev global-layer conventions
- `README.md`, `LICENSE`, and `AGENTS.md`: repository documentation, licensing, and contribution rules
- `.gitignore`: generated-file exclusions

Theme assets and implementation files live in dedicated directories. Preview decks live in `examples/`.

## Course overrides

The package provides defaults, not fixed course settings. A course can override Slidev configuration in its headmatter:

```yaml
---
theme: slidev-theme-litec
aspectRatio: 16/9
canvasWidth: 1280
themeConfig:
  courseLabel: Example Course
---
```

A course can also install and select a different Slidev theme. Local overrides stay in the course repository and do not require a fork of `course-tooling`.

## Changes in v0.8.0

- Added optional teacher copyright metadata to the course publishing configuration.
- Moved publishing information and copyright notices into a real page footer that stays at the bottom of short pages.

## Changes in v0.7.0

- Added directory resources that become ZIP downloads containing only Git-tracked regular files.
- Reduced table-cell spacing further for content-heavy teaching slides.
- Replaced the red Pages button hover color with lighter and darker blue variants.

## Changes in v0.6.0

- Added `noindex`, `nofollow`, and `noarchive` metadata to the generated course landing page and every published Slidev deck.
- Added a supplemental `robots.txt` that requests crawlers not to index the generated Pages output.
- Reduced vertical table-cell spacing and line height to prevent long tables from bleeding into the slide footer.
- Search-engine directives do not provide access control; Pages sites and downloads remain public to anyone with the URL.

## Changes in v0.5.0

- Removed combined course decks from Pages publishing. Keep `lectures/slides.md` as a local presentation entry point and publish only explicitly configured teaching units.
- Removed the obsolete combined-course labels, HTML section, PDF export, and page styles.
- Course configurations no longer use or require `course.slides`; remove the field and the three combined-course labels when upgrading.

## Changes in v0.4.0

- Pull requests validate all configured Slidev decks without exporting PDFs or installing Chromium system dependencies.
- A new commit cancels an outdated build of the same pull request, while production deployments remain serialized.
- Pushes to `main` continue to build the complete Pages site, including downloadable PDFs.
- The publisher accepts `--skip-pdf` for fast validation builds.

## Changes in v0.3.0

- Reduced table cell spacing, especially horizontal padding, so wider tables fit the slide canvas more reliably without course-specific overrides.
- Fixed GitHub Pages initialization from the reusable workflow by granting the build job `contents: read` and `pages: write`. The deployment job continues to use `pages: write` and `id-token: write`.

## Documentation

- [Tooling and course architecture](docs/architecture.md)
- [GitHub organization and rulesets](docs/github-organization.md)
- [Classroom 50 – New Organization Setup](docs/classroom50-organization-setup.md)
- [Publishing a course](docs/publishing.md)
