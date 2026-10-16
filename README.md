# LiTec Course Tooling

Shared, versioned tooling and infrastructure for LiTec Slidev courses.

The repository root is the `slidev-theme-litec` Node package. This allows course repositories to install an immutable GitHub tag directly without publishing to npm.

## Planned

- versioned Slidev theme as a Node package
- reusable GitHub Pages workflow
- shared infrastructure documentation
- immutable GitHub tags for use in course repositories

Publishing to npm is not currently planned.

## Installation

Course repositories pin an immutable GitHub tag:

```json
{
  "devDependencies": {
    "slidev-theme-litec": "github:litec-courses/course-tooling#v0.1.0"
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

## Documentation

- [GitHub organization and rulesets](docs/github-organization.md)
- [Classroom 50 – New Organization Setup](docs/classroom50-organization-setup.md)
- [Publishing a course](docs/publishing.md)

## Roadmap

- [x] Implement the Slidev package.
- [x] Implement the reusable Pages workflow.
- [ ] Pin the template to fixed package and workflow versions and verify it with a test course.
- [ ] Create reusable exam examples from existing exams.
- [ ] Apply the infrastructure to existing repositories.
- [ ] Define a process for major updates.
- [ ] Define a merge process for Dependabot.

> [!WARNING]
> Exams, solutions, and speaker notes must not be published.
