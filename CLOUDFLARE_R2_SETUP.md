# Cloudflare R2 Setup Guide for generic Electron Distribution

You don't need an Amazon S3 account! We will use **Cloudflare R2**, which is Cloudflare's storage solution. 

Electron-builder uses the setting `provider: "s3"` for Cloudflare R2 because R2 is "S3-compatible" (it speaks the same language as S3).

## Step 1: Create a Bucket in Cloudflare

1.  Log in to your **Cloudflare Dashboard**.
2.  Go to **R2** in the sidebar.
3.  Click **Create Bucket**.
4.  Name the bucket: `buddy-releases`
    *   *If you choose a different name, update `package.json` to match.*
5.  Click **Create Bucket**.
6.  Go to the **Settings** tab of your new bucket.
7.  Under **Public Access**, enable "R2.dev subdomain" (or connect a custom domain) so users can download the files.
    *   Note: For private releases, you manage access differently, but for distribution, you usually need public read access.
    *   Select **Allow Access** if prompted.

## Step 2: Get R2 Credentials

1.  In the R2 dashboard (main R2 page), look for **Manage R2 API Tokens** (usually on the right side).
2.  Click **Create API token**.
3.  Select **Edit** permissions (Admin Read & Write).
4.  Scrolldown and click **Create API Token**.
5.  **Save these values** (you only see them once!):
    *   **Access Key ID**
    *   **Secret Access Key**
    *   **Parent Account ID** (This is your Account ID)

## Step 3: Configure GitHub Secrets

1.  Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Add New Repository Secret: `R2_ACCESS_KEY_ID` (Paste your Access Key ID).
3.  Add New Repository Secret: `R2_SECRET_ACCESS_KEY` (Paste your Secret Access Key).

## Step 4: Update package.json

Open `package.json` and ensure the `publish` config matches your Cloudflare account:

```json
"publish": {
  "provider": "s3",
  "bucket": "buddy-releases",
  "endpoint": "https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com",
  "region": "auto"
}
```

*   Replace `<YOUR_ACCOUNT_ID>` with the Account ID you got in Step 2.
