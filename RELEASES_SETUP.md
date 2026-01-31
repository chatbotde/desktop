# Releasing to buddy-releases (public repo)

When you push a tag (e.g. `v1.0.0`) to this **private** repo, the GitHub Action builds the app and uploads installers to the **public** repo [chatbotde/buddy-releases](https://github.com/chatbotde/buddy-releases). Users can then download with one click from the webbuddy site.

## Add the PAT (Personal Access Token)

The workflow needs a token that can create releases and upload assets in **chatbotde/buddy-releases**. Add it as a **secret** in **this** (private buddy) repo.

### 1. Create a PAT on GitHub

1. Go to **GitHub** → your profile (top right) → **Settings**.
2. In the left sidebar, click **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
3. Click **Generate new token** → **Generate new token (classic)**.
4. Give it a name (e.g. `buddy-releases-upload`).
5. Under **Scopes**, check **repo** (full control of private repositories).
6. Click **Generate token** and **copy the token** (you won’t see it again).

### 2. Add the secret in the private buddy repo

1. Open **this** repo on GitHub (the **private** Electron buddy repo, not buddy-releases).
2. Go to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret**.
4. **Name:** `RELEASES_REPO_TOKEN`  
   **Value:** paste the PAT you copied.
5. Click **Add secret**.

After this, when you push a tag like `v1.0.0`, the workflow will use this token to create a release in **chatbotde/buddy-releases** and upload the built `.exe` (and later mac/linux artifacts if you add those jobs).

## Summary

| Where | What |
|-------|------|
| **GitHub → your profile → Settings → Developer settings → Personal access tokens** | Create a token with **repo** scope, copy it |
| **Private buddy repo → Settings → Secrets and variables → Actions** | New secret: name `RELEASES_REPO_TOKEN`, value = the PAT |

The public repo **chatbotde/buddy-releases** does not need any secrets; the workflow runs in the private repo and uses the PAT to push releases to the public one.

---

## If nothing appears in buddy-releases

1. **Check the workflow run**  
   In your **private** repo: **Actions** → open the run for the tag (e.g. v1.0.2) → open the **"Upload to public releases repo"** step.  
   - If it **failed**, the log will show the error (e.g. 403 = no permission, 404 = repo not found).

2. **PAT must have write access to buddy-releases**  
   The account that created the PAT must be able to **push** to **chatbotde/buddy-releases**.  
   - If **chatbotde** is an **organization**: that account must be a member with **Write** (or Admin) access to the **buddy-releases** repo.  
   - If **chatbotde** is a **user**: the PAT must be from that user, or from a collaborator with write access.

3. **Re-run or push a new tag**  
   After fixing the PAT or permissions, either **Re-run all jobs** for the failed run, or push a new tag (e.g. `git tag v1.0.3 && git push origin v1.0.3`).
