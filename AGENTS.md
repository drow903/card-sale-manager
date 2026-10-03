# Repository workflow

## GitHub releases

- Default to GitHub CLI device authorization and GitHub's web flow so the release commit on `main` is created and marked Verified by GitHub.
- Do not attempt local SSH or GPG commit/tag signing unless the user explicitly requests it.
- Build Windows releases from a clean, short staging path under `C:\Users\dillon_row\Documents\Codex\csm-v<version>-build` to avoid Windows/NSIS path-length failures.
- Before publishing, verify syntax and tests, the package version, the installer and portable builds, `latest.yml`, and the remote commit's verification status.
- Create releases from the GitHub-verified `main` commit and upload the Setup executable, Portable executable, blockmap, `latest.yml`, and the current import template.
