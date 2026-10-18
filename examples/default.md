---
theme: ../
title: LiTec Theme
themeConfig:
  courseLabel: Theme Preview
---

# LiTec Slidev Theme

Shared defaults remain configurable in each course repository.

---
layout: section
---

# Section

Clear visual structure for a new topic.

---

# Content and code

- Readable typography
- Local Inter and JetBrains Mono fonts
- Layouts for presentations and exercises

```ts
const courseFormat = '3/2'
```

---

# Compact tables

| Setting | Purpose | Example |
| --- | --- | --- |
| `image` | Select an image | `nginx:alpine` |
| `build` | Build an image | `.` |
| `ports` | Publish a port | `8080:80` |
| `environment` | Set runtime configuration | `LOG_LEVEL=info` |
| `volumes` | Persist or mount data | `app_data:/data` |

---
layout: exercise
---

# Try an override

Set `aspectRatio` and `canvasWidth` in the course headmatter and verify the deck on its target projector.
