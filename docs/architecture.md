# Tooling and Course Architecture

`course-tooling` provides shared, versioned infrastructure. The public template pins an immutable tooling release, and private course repositories are created from the template.

```mermaid
flowchart TD
  tooling["course-tooling<br/>public repository"]
  tag["Immutable tag<br/>vMAJOR.MINOR.PATCH"]
  package["slidev-theme-litec<br/>theme and publisher"]
  workflow["Reusable Pages workflow"]
  template["tmpl-slidev-course<br/>public template"]
  course["Private course repository"]
  config["Course content and<br/>lectures/publish.yml"]
  pages["Public GitHub Pages<br/>slides, slide PDFs, handouts"]
  private["Private material<br/>exams, solutions, speaker notes"]

  tooling --> tag
  tag --> package
  tag --> workflow
  package -->|"pinned Git dependency"| template
  workflow -->|"pinned reusable workflow"| template
  template -->|"Use this template"| course
  course --> config
  config -->|"explicitly published files"| pages
  course --> private
  private -.->|"never published"| pages

  classDef public fill:#e8f3fb,stroke:#01315c,color:#01315c
  classDef private fill:#fbecec,stroke:#a33,color:#611
  class tooling,tag,package,workflow,template,pages public
  class course,config,private private
```

Tooling updates do not change existing courses automatically. A new tooling tag is verified first; each template or course then updates both pins in one pull request and requires `ci / build` before merging.

> [!WARNING]
> GitHub Pages artifacts are public. Exams, solutions, and speaker notes must remain outside the publishing configuration.
