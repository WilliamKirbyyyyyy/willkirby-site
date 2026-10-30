# willkirby.co.uk

My personal site. Plain HTML, CSS and JavaScript: no framework, no build step, no trackers.

## What's in it (v3, live since 30 October 2026)

The site is styled as a set of drawing sheets:

- **Home:** a line drawing of RIVET's window draws itself, then a scan line reveals the real app and hands over to a short clip of Spark answering a question. Then come a word-fill statement, sticky chapter covers for RIVET, the investigation and About, and the contact rows.
- **/rivet/:** the case study, with design directions in a pinned sideways strip, milestones with a sticky counter, and screenshots.
- **/investigation/:** the Temu report to Trading Standards, as a case file with an evidence wall and a law table.
- **/about/:** profile, music, leadership, a VR headset build sheet whose exploded renders change as you scroll, and awards.

Motion is progressive. Without JavaScript, or with `prefers-reduced-motion`, every page is already complete, because the hidden start states only apply under `html.anim`.

## Structure

```
index.html, rivet/, investigation/, about/   the four pages
css/v3.css        all styles
js/v3.js          all motion: GSAP + ScrollTrigger (cdnjs) and Lenis (unpkg)
img/              web-ready WebP images
media/            the hero clip (rivet-spark-1600.mp4 and -960.mp4)
images/           original screenshots, untouched (not deployed)
tools/optimize.py rebuilds img/ from images/
css/styles.css, js/main.js   the old v2 styles; no page uses them now
```

The hero clip is fetched whole and played from a blob URL. Workers static assets don't answer byte-range requests, and Safari needs them to stream video.

## Run locally

```bash
python -m http.server 8137
```

Then open http://localhost:8137. Browsers cache hard, so add `?v=N` to the URL after editing CSS or JS.

## Deploy

The site is a Cloudflare Worker with static assets. `.assetsignore` is an allowlist: a new top-level folder only deploys once it is added there.

Preview (workers.dev only, can't touch the domain):

```bash
npx -y wrangler@4 deploy -c wrangler.preview.jsonc
```

Live (willkirby.co.uk and www), from `master`:

```bash
npx -y wrangler@4 deploy
```

## Images

Put originals in `images/`, add them to the `JOBS` list in `tools/optimize.py`, then run:

```bash
python tools/optimize.py
```

Strip GPS data from photos, and never publish an IP address in a screenshot.

Fonts: Geist and Geist Mono from Google Fonts.
