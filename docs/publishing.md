# Publishing a Course

The reusable workflow builds and deploys the files explicitly listed in `lectures/publish.yml`.

## Publish configuration

The course repository controls every public deck and handout:

```yaml
course:
  title: Subject · Topic
  description: Slides and handouts

labels:
  openSlides: Open slides
  downloadSlides: Download slides
  downloadHandoutMarkdown: Download handout
  units: Units
  footer: Built from files explicitly listed in lectures/publish.yml.

sections:
  - title: Web Development
    description: JavaScript, backend, and frontend
    units:
      - slug: 01-example
        title: Example unit
        slides: lectures/01-web-development/01-example-slides.md
        handout: lectures/01-web-development/01-example-handout.md
  - title: Media Production
    units:
      - slug: 02-camera
        title: Camera Basics
        resources:
          - title: Camera Settings (PDF)
            file: lectures/02-media-production/camera-settings.pdf
          - title: Lenses (PDF)
            file: lectures/02-media-production/lenses.pdf
```

Sections group related units on the generated course page. A unit can contain Slidev slides, a Markdown handout, resources, or any combination of them. `resources` accepts multiple explicitly listed files, including PDF documents. Legacy configurations with a top-level `units` array remain supported.

The combined local deck, conventionally `lectures/slides.md`, is intentionally not part of the Pages configuration. Publish the individual teaching units and keep the combined deck as a local presentation entry point.

Only listed handouts and resources are copied. Slide builds always use `--without-notes`.

## Course package

Pin `course-tooling` to an immutable tag and expose the publisher command:

```json
{
  "scripts": {
    "pages:build": "litec-course-publish"
  },
  "devDependencies": {
    "@slidev/cli": "53.0.0",
    "playwright-chromium": "1.64.1",
    "slidev-theme-litec": "github:litec-courses/course-tooling#v0.6.0"
  }
}
```

## Caller workflow

Create `.github/workflows/pages.yml` in the course repository:

```yaml
name: GitHub Pages

on:
  workflow_dispatch:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  ci:
    uses: litec-courses/course-tooling/.github/workflows/publish-pages.yml@v0.6.0
```

Pull requests validate the site without PDF exports. Pushes and manual runs on `main` build the unit PDFs and deploy the complete site to GitHub Pages.

## Search-engine indexing

The publisher adds `<meta name="robots" content="noindex, nofollow, noarchive">` to the course landing page and every generated Slidev deck. It also writes a supplemental `robots.txt` with `Disallow: /`.

Project Pages are hosted below a shared origin such as `https://organization.github.io/course/`. Crawlers normally request `robots.txt` only from the origin root, so the HTML metadata is the primary per-course directive. These directives ask compliant search engines not to index the material; they do not restrict access. Anyone with the URL can still open and share the site and its downloads.

## Releases and updates

Each release uses an immutable `vMAJOR.MINOR.PATCH` tag that matches the package version. While the package remains below `v1.0.0`, minor releases may contain documented breaking changes and patch releases contain compatible fixes. After `v1.0.0`, breaking changes require a major release.

Create and verify a release through a pull request before tagging the merged commit. Course repositories keep the package and reusable-workflow pins on the same tag. Dependabot opens grouped update pull requests; review both pins, require `ci / build`, and squash-merge successful updates. Update major versions deliberately and verify the affected course in a browser before merging.

> [!WARNING]
> Pages artifacts are public. The publisher excludes speaker notes from HTML builds and only copies handouts listed in `lectures/publish.yml`. Never list exams or solutions.
