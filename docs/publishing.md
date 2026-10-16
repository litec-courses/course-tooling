# Publishing a Course

The reusable workflow builds and deploys the files explicitly listed in `lectures/publish.yml`.

## Publish configuration

The course repository controls every public deck and handout:

```yaml
course:
  title: Subject · Topic
  description: Slides and handouts
  slides: lectures/slides.md

labels:
  course: Complete course
  openCourseSlides: Open course slides
  downloadCourseSlides: Download course slides
  openSlides: Open slides
  downloadSlides: Download slides
  downloadHandoutMarkdown: Download handout
  units: Units
  footer: Built from files explicitly listed in lectures/publish.yml.

units:
  - slug: 01-example
    title: Example unit
    slides: lectures/01-example-slides.md
    handout: lectures/01-example-handout.md
```

Only listed handouts are copied. Slide builds always use `--without-notes`.

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
    "slidev-theme-litec": "github:litec-courses/course-tooling#v0.1.1"
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
    uses: litec-courses/course-tooling/.github/workflows/publish-pages.yml@v0.1.1
```

Pull requests only build the site. Pushes and manual runs on `main` deploy it to GitHub Pages.

## Releases and updates

Each release uses an immutable `vMAJOR.MINOR.PATCH` tag that matches the package version. Patch releases contain compatible fixes, minor releases add compatible features, and major releases may require course changes.

Create and verify a release through a pull request before tagging the merged commit. Course repositories keep the package and reusable-workflow pins on the same tag. Dependabot opens grouped update pull requests; review both pins, require `ci / build`, and squash-merge successful updates. Update major versions deliberately and verify the affected course in a browser before merging.

> [!WARNING]
> Pages artifacts are public. The publisher excludes speaker notes from HTML builds and only copies handouts listed in `lectures/publish.yml`. Never list exams or solutions.
