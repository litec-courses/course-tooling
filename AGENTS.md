# Working Rules

## Content

- Define the repository purpose, target users, prerequisites, and supported usage in `README.md`.
- Write all documentation in English.
- Write all code examples in English, including variable, function, method, class, property, parameter, and example-data names.
- Explain new terms when they first appear.
- Verify version-dependent statements against official sources.
- Keep code examples small and executable.
- Keep documentation short and direct. Avoid unnecessary duplication.

## Files

- Shared infrastructure documentation: `docs/`
- Slidev theme and Node package: repository root
- Reusable GitHub workflows: `.github/workflows/`
- Keep package-specific documentation in `README.md`.
- Keep repository-wide setup and maintenance guidance in `docs/`.
- Use lowercase ASCII kebab-case for new file and directory names.
- Keep the repository root as small as practical. Place examples, documentation, scripts, and configuration in dedicated directories when supported by their tools.
- Explain files that must remain in the repository root in `README.md`.

## Design

- Prefer Markdown.
- Do not use inline CSS or decorative HTML in documentation.
- Do not manually wrap prose.
- Keep shared Slidev design in `layouts/`, `styles/`, `setup/`, `components/`, and `assets/`.
- Set an explicit root font size for screen styles and use `rem` or `em` for typography and spacing. Pixel units are acceptable for one-pixel borders.
- Use print-appropriate physical units such as `mm` for page geometry and `pt` for typography in print-only styles.
- Use GitHub-style alerts such as `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION` when they make documentation easier to scan.

## Versioning and Distribution

- Use GitHub versions and immutable tags for package and workflow consumers.
- Do not publish packages to npm unless explicitly requested.
- Document compatibility and breaking changes before creating a release tag.
- Pin package and reusable-workflow references in course repositories to a fixed version.
- Treat theme settings as defaults. Course repositories must be able to override the theme, aspect ratio, canvas size, and course-specific configuration without forking this repository.
- Keep technical names and slugs lowercase with the `litec-` prefix where applicable.
- Use `LiTec` for the visible organization name.

## Publishing

- Treat repository contents, release artifacts, packages, workflows, and Pages builds as public.
- Do not include solutions, exams, speaker notes, credentials, tokens, or `_temp/`.
- Never add exam or solution files to packages, workflow artifacts, examples, fixtures, or documentation.
- Keep speaker notes out of Pages builds with `--without-notes`.
- Add downloadable or published material only when explicitly requested.
- Preserve third-party license files and attribution.
- LiTec names, logos, and branding are not covered by the MIT License.

## Verification and Git

- For theme changes, build the package, template course, and demo, then verify them in a browser.
- For workflow changes, validate the workflow and run it against the template or a representative test course.
- For documentation changes, verify affected links, commands, and version-dependent statements.
- Report checks that were not run.
- Preserve existing changes and stage only files changed for the current task.
- Keep changes, branches, commits, and pull requests separate from other repositories in the workspace.
- Ask for approval before committing, pushing, tagging, releasing, or publishing.
- Use Conventional Commits for every commit message, for example `feat: add reusable Pages workflow`, `fix: exclude speaker notes`, or `docs: document organization setup`.
- Do not use subagents unless explicitly requested.
