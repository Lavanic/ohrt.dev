# ohrt.dev

<p align="center">
  <a href="https://ohrt.dev"><img src=".github/screenshots.webp" width="428" alt="ohrt.dev on a desktop browser and on a phone"></a>
</p>

<p align="center">
  <a href="https://github.com/Lavanic/ohrt.dev/actions/workflows/deploy.yml"><img src="https://github.com/Lavanic/ohrt.dev/actions/workflows/deploy.yml/badge.svg" alt="deploy"></a>
  <a href="https://ohrt.dev"><img src="https://img.shields.io/website?url=https%3A%2F%2Fohrt.dev&label=ohrt.dev" alt="site status"></a>
  <a href="https://github.com/Lavanic/ohrt.dev/commits/main"><img src="https://img.shields.io/github/last-commit/Lavanic/ohrt.dev" alt="last commit"></a>
  <a href="https://astro.build"><img src="https://img.shields.io/github/package-json/dependency-version/Lavanic/ohrt.dev/astro?logo=astro&logoColor=white" alt="astro version"></a>
  <a href="https://pages.github.com"><img src="https://img.shields.io/badge/hosted%20on-GitHub%20Pages-222?logo=github" alt="hosted on GitHub Pages"></a>
</p>

My personal website, a GeoCities-era homage with a modern build underneath. Written in [Astro](https://astro.build), every page is a plain static file. The visitor counter, contribution graph, changelog and status note are fetched at build time and refreshed in the browser.

## Development

```sh
npm install
npm run dev
```

Runs at `localhost:4321`. `npm run check` type-checks and `npm run format` runs Prettier.

## Deployment

Automatically deployed to GitHub Pages on every push to `main`, plus a daily rebuild so the live widgets stay fresh.
