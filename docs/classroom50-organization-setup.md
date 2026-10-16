# Classroom 50 – New Organization Setup

Short checklist for preparing a new GitHub organization for Classroom 50.

## 1. GitHub CLI

Install GitHub CLI on Windows:

```powershell
winget install --id GitHub.cli
```

Login:

```powershell
gh auth login
gh auth status
```

Install/update Classroom 50 teacher CLI:

```powershell
gh extension install foundation50/gh-teacher
# Optional: gh extension install foundation50/gh-student
gh extension upgrade --all
```

Check:

```powershell
gh teacher --version
```

## 2. Initialize organization

Run:

```powershell
gh teacher init <ORG>
```

Example:

```powershell
gh teacher init litec-SEW1
```

If requested, allow `gh` to refresh its GitHub permissions.

`init` creates the `classroom50` repository and prepares the organization.

## 3. Create service PAT

`gh teacher init` asks for a `CLASSROOM50_SERVICE_TOKEN`.

Create a **Fine-grained Personal Access Token** on GitHub:

**GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**

Use:

- **Resource owner:** `<ORG>`
- **Expiration:** according to local policy
- **Repository access:** `All repositories`
- **Repository permissions:**
  - `Contents: Read-only`
  - `Metadata: Read-only` (automatic)

`All repositories` means all current and future repositories **inside this organization only**. This is necessary because future student repositories do not exist yet.

Paste the token when `gh teacher init` asks for it.

Do **not** store the PAT in source code or Git.

## 4. GitHub organization settings

Open:

```
Organization → Settings → Member privileges
```

Set/check:

- **Base permissions:** `No permission`
- **Repository creation:** Private enabled
  - Public is also enabled on GitHub Team because GitHub couples both settings
- **Private repository forking:** disabled
- **Repository deletion and transfer:** disabled
- **Repository visibility changes:** disabled
- **Issue deletion:** disabled
- **Create discussions with read access:** disabled
- **Team creation:** ENABLED
- **Projects base permissions:** `No access`
- **Pages creation**: Public -> enabled
- **App access requests:** `Disable app access requests`
- **GitHub Apps:** repository admins may **not** install GitHub Apps
- **Branch renames:** repository admins may **not** rename branches protected by organization rules

Do not disable Pages settings configured by `gh teacher init`.

## 5. Verify organization

Run:

```powershell
gh teacher audit <ORG>
```

Example:

```powershell
gh teacher audit litec-SEW1
```

Resolve everything reported by the audit.

Some settings cannot be checked through the GitHub API; confirm the manual settings listed by `audit` as well.

## 6. Allow classroom50.org

Our organizations use OAuth app restrictions.

As an **organization owner**:

1. Open `https://classroom50.org`
2. Sign in with GitHub.
3. Authorize Classroom 50.
4. Explicitly grant access to the new organization.

Keep:

- OAuth restrictions: **enabled**
- App access requests: **disabled**
- Classroom 50: **explicitly approved only for required organizations**

Students can then use `classroom50.org` without being allowed to request arbitrary OAuth applications.

### Reenable the classroom50.org OAuth app

Open the organization settings on GitHub: **Third-party access → OAuth app policy → Grant access to classroom50.org**.

## 7. Create classroom

```powershell
gh teacher classroom add <ORG> <CLASSROOM>
```

Example:

```powershell
gh teacher classroom add litec-SEW1 sew1-2026
```

Add students:

```powershell
gh teacher roster add <ORG> <CLASSROOM> <GITHUB-USERNAME>
```

Check:

```powershell
gh teacher roster list <ORG> <CLASSROOM>
```

Students must accept the GitHub organization invitation and can then use:

```
https://classroom50.org
```

## Quick check

```powershell
gh auth status
gh teacher --version
gh teacher audit <ORG>
gh teacher roster list <ORG> <CLASSROOM>
```

The organization is ready when `gh teacher audit` succeeds, the manual settings are confirmed, and a test student can see the classroom at `classroom50.org`.
