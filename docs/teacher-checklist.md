# Checkliste für Lehrkräfte: Vom Template zur Kursseite

Direkt auf `main` arbeiten: bearbeiten → Vorschau prüfen → committen → pushen. Zusätzliche Branches und Pull Requests sind für Kurs-Repositories optional.

## 1. Kurs erstellen

- [ ] [tmpl-slidev-course](https://github.com/litec-courses/tmpl-slidev-course) öffnen → **Use this template → Create a new repository**; Eigentümer, Kursnamen und Sichtbarkeit wählen. Nur den Standardbranch übernehmen.
- [ ] Direkte Pushes auf `main` erlauben. In `litec-courses` setzt ein Organization-Owner `protection_profile: off` und prüft die wirksamen Repository-Regeln; siehe [Organization-Einrichtung](github-organization.md).
- [ ] Neues Repository klonen und in VS Code öffnen. Unter Windows eine Arbeitskopie im Linux-Dateisystem von WSL verwenden.
- [ ] Node.js ≥ 22.12 und Bun in derselben Umgebung installieren; im Kursverzeichnis `bun install --frozen-lockfile` ausführen.
- [ ] `README.md`, Paketnamen in `package.json` und kursbezogene Regeln in `AGENTS.md` anpassen.
- [ ] Paket und Workflow auf denselben veröffentlichten Tooling-Tag festlegen (`package.json` und `.github/workflows/pages.yml`).

## 2. Slides und Worksheets anlegen

- [ ] Beispieldeck nach `lectures/01-topic/01-topic-slides.md` kopieren; Titel, Autor, eindeutigen `routeAlias` und `themeConfig.courseLabel` setzen.
- [ ] Lernziele, kurze Beispiele, Übungen, Exit Ticket und Quellen ergänzen.
- [ ] `lectures/01-topic/01-topic-worksheet.md` erstellen: Arbeitsauftrag, Arbeitspfad, Erfolgskriterien, Hilfen und Erweiterung. Auf der Übungsfolie darauf verweisen.
- [ ] Kursweit eindeutige Worksheet-Dateinamen verwenden. Ab **v0.9.2** behalten Downloads den Quelldateinamen; `handout:` akzeptiert beliebige Namen, auch `-begleitblatt.md` und `-handout.md`.
- [ ] Deck bei Bedarf in `lectures/slides.md` für eine gemeinsame lokale Präsentation einbinden; dadurch wird es noch nicht veröffentlicht.
- [ ] Einheit in `lectures/publish.yml` eintragen; nur eingetragene Inhalte werden veröffentlicht. Kursangaben, Urheber und Button-Beschriftungen anpassen.

```yaml
# Under sections → units:
- slug: 01-topic
  title: 01 · Topic
  slides: lectures/01-topic/01-topic-slides.md
  handout: lectures/01-topic/01-topic-worksheet.md
  resources:
    - title: Starter project (ZIP)
      directory: examples/01-topic/starter-project
```

## 3. ZIP-Ordner und weitere Downloads ergänzen

- [ ] Ausgangsdateien unter `examples/01-topic/starter-project/` ablegen; `resources.directory` erzeugt das ZIP automatisch. Kein manuelles Packen nötig.
- [ ] Gewünschte Dateien mit `git add examples/01-topic/starter-project` zu Git hinzufügen; ZIPs enthalten nur von Git erfasste reguläre Dateien, einschließlich erfasster Dotfiles (Dateien mit führendem Punkt).
- [ ] Für vorhandene PDFs, ZIPs oder andere einzelne Downloads `resources.file: path/to/file.pdf` statt `directory` verwenden.
- [ ] Lernende auf den Download der Kursseite verweisen. Prüfungen, Lösungen und Zugangsdaten aus allen veröffentlichten Einheiten und Ressourcenordnern heraushalten.

## 4. Vorschau und Build mit Bun

Im **Kurs-Repository** ausführen, nicht in `course-tooling`. Vorschau-Server mit `Ctrl+C` beenden.

| Befehl | Zweck |
| --- | --- |
| `bun run slides` | Gemeinsames lokales Kursdeck präsentieren |
| `bun run slides:deck lectures/01-topic/01-topic-slides.md` | Einzelnes Deck während der Bearbeitung anzeigen |
| `bun run slides:demo` | Layout-Beispiele des Templates öffnen |
| `bun run slides:build` | Gemeinsames Kursdeck bauen; veröffentlicht nichts |
| `bun run pages:build -- --skip-pdf` | Kursseite, Decks und Downloads ohne Folien-PDFs bauen |
| `bun run pages:build` | Gesamte Seite einschließlich Folien-PDFs bauen; benötigt Playwright Chromium |
| `bun run pages:preview` | Erzeugtes `dist/` lokal anzeigen |

- [ ] Für lokale PDF-Exporte Chromium einmalig mit `bunx playwright install chromium` installieren; unter Linux kann zusätzlich `bunx playwright install --with-deps chromium` nötig sein.
- [ ] Folien, Worksheets und ZIP-Inhalte prüfen. Nach einem Build mit `--skip-pdf` funktionieren Folien-PDF-Links erst nach einem vollständigen Build.
- [ ] Normalfall: `bun install --frozen-lockfile`. Nach bewusster Änderung der Abhängigkeiten: `bun install`, anschließend `package.json` und `bun.lock` gemeinsam committen.

## 5. Über main veröffentlichen

- [ ] GitHub-Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**. Vorhandenen Pages-Workflow des Templates beibehalten.
- [ ] Gewünschte Quelldateien committen und auf `main` pushen; beides geht über Source Control in VS Code. `node_modules/` und `dist/` nicht committen.
- [ ] Unter **Actions → GitHub Pages** auf erfolgreichen Build und erfolgreiches Deployment warten. GitHub installiert Abhängigkeiten sowie Chromium und baut die gesamte Seite.
- [ ] Deployment-URL öffnen (üblicherweise `https://<owner>.github.io/<repository>/`) und Folien, PDFs, Worksheets sowie ZIP-Downloads testen.
- [ ] Nach einem Tooling-Update aktualisierte Versionsreferenzen und Lockfile auf `main` pushen; dadurch wird die gesamte Seite neu gebaut. Bei v0.9.2 extern geteilte Worksheet-Links auf die neuen Quelldateinamen umstellen.
- [ ] Unveränderte Quellen erneut bauen: **Actions → GitHub Pages → Run workflow → main**.

Details: [Veröffentlichung konfigurieren](publishing.md). GitHub-Anleitungen: [Repository aus Template erstellen](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template), [Pages konfigurieren](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
