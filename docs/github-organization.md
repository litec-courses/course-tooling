# Managing the GitHub Organization

This guide applies to `litec-courses` and is intended for organization owners. Complete all steps on GitHub.

## GitHub Education

Verified teachers can upgrade a teaching organization to GitHub Team:

1. Open the [Teacher Dashboard](https://education.github.com/globalcampus/teacher).
2. Select **Upgrade your academic organizations**.
3. Select **Upgrade to GitHub Team**.

This option is not available under Billing. If it is missing, check the [Education status](https://github.com/settings/education/benefits) and the owner role.

## Goal

A **ruleset** groups protection rules for repositories. The `protection_profile` **custom property** selects the profile:

| Profile | Protection |
| --- | --- |
| `off` | no organization ruleset |
| `pull_request` | pull request without another person's approval |
| `review_required` | pull request with one approval |

> `off` does not remove other protection rules. GitHub combines all matching rules.

Prerequisites: GitHub Team through Education or GitHub Enterprise, appropriate owner permissions, and a default branch.

## 1. Custom property

Organization: **Settings → Custom properties**

1. Create `protection_profile` as a **Single select** property.
2. Add `off`, `pull_request`, and `review_required`.
3. Enable **Require this property for all repositories**.
4. Initially select `off` as the default while configuring the organization.
5. Leave **Require explicit user-specified values** disabled.
6. Leave **Allow repository actors to set this property** disabled.

Repositories without an explicit value inherit the default. This allows Classroom 50 to create repositories.

| Usage | Target profile |
| --- | --- |
| `litec-courses` | `pull_request` as the eventual default |
| Classroom 50 organization | `off` as the default |
| pull-request exercise | `pull_request` |
| jointly maintained infrastructure | `review_required` |
| sandbox | `off` |

Assign existing repositories under **Set values**. The `review_required` profile requires a second person.

## 2. Pull-request protection

Organization: **Settings → Repository → Rulesets → New ruleset → New branch ruleset**

1. Set the name to `pull-request-protection`.
2. Set the status to **Active**.
3. Select **Repositories matching a filter**.
4. Set the filter to `-props.protection_profile:off`.
5. Target the **Default branch**.
6. Check the preview.

Enable:

- **Restrict deletions**
- **Require a pull request before merging** with `0` approvals
- **Require conversation resolution before merging**
- **Require linear history**
- **Block force pushes**

Do not configure a broad administrator bypass. Restrict emergency access to a small owner team and document its use.

Under **Require a pull request before merging → Additional settings**, select only **Squash** under **Allowed merge methods**. This is compatible with **Require linear history**.

Enable **Require status checks to pass**:

- Add the `ci / build` job name manually under **Add checks**.
- Initially leave **Require branches to be up to date before merging** disabled.
- Enable **Do not require status checks on creation**.

Organization rulesets do not automatically suggest existing checks.

## 3. Required approval

Create a second branch ruleset:

1. Set the name to `required-review`.
2. Set the status to **Active**.
3. Set the filter to `props.protection_profile:review_required`.
4. Target the **Default branch**.
5. Require a pull request and one approval.

Both rulesets apply to repositories using `review_required`.

## 4. Test and activate

> [!IMPORTANT]
> GitHub Team does not provide Evaluate mode. Keep the default set to `off` during setup and protect only a test repository first.

Assign `pull_request` and then `review_required` to a test repository.

- `pull_request`: test pushing, force-pushing, deletion, and unresolved conversations.
- `pull_request`: merging without approval must be possible.
- `review_required`: approval from another person must be required.
- `off`: organization rulesets must not appear under `/<organization>/<repository>/rules`.
- Classroom 50: a newly created repository must inherit `off`.

Then assign the real repositories. For `litec-courses`, `pull_request` can now become the default. Verify all profiles again. Changes apply immediately.

## Change a profile

Organization: **Settings → Custom properties → Set values**

Before reducing protection, document the reason, responsible person, duration, and restoration plan. Check the effective repository rules under `https://github.com/ORGANIZATION/REPOSITORY/rules`.

Change the profile for individual repositories. Disable a ruleset only for a coordinated organization-wide pause.

## Transfer to another organization

1. In the source organization, open **Settings → Repository → Rulesets**.
2. Open the ruleset and export it as JSON through `…`.
3. In the target organization, select **Settings → Repository → Rulesets → New ruleset → Import a ruleset**.
4. Review the JSON and create the ruleset.

> [!IMPORTANT]
> First create `protection_profile` with the same values in the target organization. Property values, repository settings, and organization-specific bypass IDs are not transferred.

## Review

- Review all uses of `off` every semester.
- Spot-check Classroom 50 defaults.
- Record changes with their reason and date.
- Optionally version ruleset JSON without IDs or internal details.

## Sources

- [Creating rulesets for repositories in your organization](https://docs.github.com/en/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization)
- [Managing custom properties for repositories in your organization](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization)
- [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Managing rulesets for repositories in your organization](https://docs.github.com/en/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization)
- [Classroom 50 architecture](https://github.com/foundation50/classroom50/discussions/21)
