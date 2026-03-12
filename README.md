# bigdit

Static, mobile-first web app for on-set colour and exposure utilities. The first tool in the suite is `Harlaton`, a mired shift calculator for preserving the same offset between a light source and camera white balance when a setup changes.

## What is included

- `/` landing shell for a future tool suite
- `/tools/mired-shift/` calculator with two solve modes
- reusable math and validation modules under `/src/lib`
- copy-friendly result summary
- local persistence for the last-used values
- Node test coverage for the calculation engine

## Local development

Requirements: Node.js 22 or newer.

```sh
npm run dev
```

The local server runs at `http://localhost:3000`.

## Tests

```sh
npm test
```

## Build

```sh
npm run build
```

This copies the static site into `dist/`, ready to deploy on a standard static host, VPS, or cPanel-style environment.

## Deployment

Upload the contents of `dist/` to any static web root.

- `index.html` provides the tool landing page.
- `tools/mired-shift/index.html` is the calculator route.
- `src/` contains the shared JS and CSS assets referenced by both pages.

If your host serves the site from a subdirectory instead of the domain root, update the absolute asset paths in `index.html` and `tools/mired-shift/index.html`.

## GitHub Pages

This project includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds `dist/` and deploys it to GitHub Pages on every push to `main`.

Typical setup:

```sh
git init
git add .
git commit -m "Initial bigdit site"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then in GitHub:

1. Open `Settings > Pages`.
2. Set `Source` to `GitHub Actions`.
3. Push to `main` and let the workflow publish the site.

### Custom domain

For a custom domain such as `harlaton.yourdomain.com`:

1. In `Settings > Pages`, enter the custom domain.
2. Add the DNS record at your domain provider.

For a subdomain, add a `CNAME` record pointing to `<your-github-username>.github.io`.

For an apex/root domain, use your DNS provider's `ALIAS`, `ANAME`, or the `A` records GitHub Pages specifies in its setup UI.

This repo already includes a `CNAME` file for `bigdit.co.uk`, and the build copies it into `dist/` for GitHub Pages.

## Architecture notes

- `src/lib/calculators/mired.js`: pure calculation engine
- `src/lib/validation/kelvin.js`: input parsing and range warnings
- `src/lib/formatting/numbers.js`: presentation formatting
- `src/tools/mired-shift/app.js`: UI state, rendering, local storage, copy action
- `scripts/serve.js`: zero-dependency local static server
- `scripts/build.js`: zero-dependency static build copy

The UI is intentionally isolated from the calculator logic so future tools can reuse the same domain layer or add new calculators alongside it.

## Future extension

The root landing page and `/tools/...` route structure leave room for additional production utilities such as ND/stop, shutter, exposure, or LUT helpers without having to restructure the app first.
