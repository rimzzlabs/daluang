# Deploy [Host your own copy of Daluang on Cloudflare]

A GitHub workflow deploys the CMS to your Cloudflare account. It runs when release-please
makes a release of your fork. You can also run it by hand.

## What you need

- A Cloudflare account, with a domain for the CMS, for example `cms.example.com`.
- A GitHub account, and a fork of [rimzzlabs/daluang](https://github.com/rimzzlabs/daluang).

## Make a GitHub OAuth app

1. Open [the developer settings of GitHub](https://github.com/settings/developers) and make a new OAuth app.
2. Set the homepage URL to `https://<your domain>`.
3. Add the callback URL `https://<your domain>/api/auth/callback/github`.
4. Make a client secret. Keep it for the next part.

One OAuth app can also have the callback URL of local development.

## Make a Cloudflare API token

1. Open the API tokens of your Cloudflare profile.
2. Make a token from the template "Edit Cloudflare Workers".
3. Add the permission "D1: Edit". The workflow makes the database and applies its migrations.
4. Keep the token for the next part.

If a step of the workflow stops with a permission error, the log names the permission.

## Set the secrets and the variables of your fork

Open **Settings → Secrets and variables → Actions** of your fork.

| Name                        | Kind     | Value                                                      |
| --------------------------- | -------- | ---------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`      | Secret   | The API token                                              |
| `CLOUDFLARE_ACCOUNT_ID`     | Secret   | The ID of your Cloudflare account                          |
| `BETTER_AUTH_SECRET`        | Secret   | 32 or more random characters: `openssl rand -base64 32`    |
| `AUTH_GITHUB_CLIENT_ID`     | Secret   | The client ID of the OAuth app                             |
| `AUTH_GITHUB_CLIENT_SECRET` | Secret   | The client secret of the OAuth app                         |
| `CMS_DOMAIN`                | Variable | The domain of the CMS, for example `cms.example.com`       |
| `ALLOWED_GITHUB_USERS`      | Variable | The GitHub usernames that can sign in, separated by commas |

GitHub does not accept a secret name that starts with `GITHUB_`. That is why two names
start with `AUTH_`.

## Deploy

1. Open the **Actions** tab of your fork, and turn on the workflows. GitHub turns them off
   in a new fork.
2. Open **Settings → Actions → General** of your fork.
3. Set **Workflow permissions** to "Read and write permissions".
4. Select "Allow GitHub Actions to create and approve pull requests".
5. Open **Actions → Deploy → Run workflow**, and give the branch `main`.

The workflow does these steps:

1. It makes the D1 database `daluang`, if it does not exist.
2. It applies the migrations of `apps/cms/migrations`.
3. It builds the CMS and deploys it, with the secrets and the domain.

After that, each release deploys again. release-please opens a pull request for each
release, and a merge of that pull request makes the release.

## Protect the sign-in

The CMS allows 3 sign-in requests in 10 seconds from one address. Each Worker isolate
keeps its own count. For one count across all of Cloudflare, add a rate limiting rule:

1. Open the dashboard of your domain on Cloudflare.
2. Open **Security → WAF → Rate limiting rules**, and make a new rule.
3. Match the requests where the URI path starts with `/api/auth/`.
4. Set the limit, for example 20 requests in 1 minute for each IP address.

## Sign in

Open the domain of the CMS, and sign in with GitHub. At the first sign-in, the CMS asks
for your site and your languages. [First sign-in](/guide/first-sign-in) tells you more.
