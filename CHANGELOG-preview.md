# Changelog of Preview builds

Release notes of the **Preview** builds (an odd middle number: 0.5.x, 0.7.x), newest first. A Preview is a build the author hands to a few adults (ADR-0089, ADR-0090). It is published on GitHub as a pre-release, **never** as the download of the website, and its notes are **not** in [`CHANGELOG.md`](CHANGELOG.md), which the website reads. The format is the same as there: `## x.y.z (YYYY-MM-DD)`, then lines starting with `- `, the first a short bold sentence. When a Preview line is promoted, the Stable version takes its entry in `CHANGELOG.md`.

## 0.7.1 (2026-11-14)
- **Peak keeps still and quiet while you are in something full-screen, presenting, or the screen is locked.** Before, it could start a walk, a hop or a perch while you watched a full-screen video or gave a presentation; now it starts nothing, stops a walk in progress and says nothing until you are out of it. Nothing else changes.
- Not yet tried: a full-screen video, a presentation and a locked screen on a real computer, and whether a borderless full-screen window counts.

## 0.7.0 (2026-11-13)
- **The first Preview after Stable 0.6.0.** It has the same program as 0.5.1 and 0.6.0; nothing you can see has changed. It starts the next Preview line: from here the new work goes, and the app offers the next 0.7.x by itself. You stay on Preview, and the Stable 0.6.0 is skipped because 0.7.0 contains everything it does.

## 0.5.1 (2026-11-13)
- **A second Preview build, to prove the update inside the app.** It behaves exactly as 0.5.0 and 0.4.2; nothing you can see has changed. If you run 0.5.0, the app should offer this one by itself.

## 0.5.0 (2026-11-13)
- **The first Preview build.** It behaves exactly as 0.4.2; the only difference you can see is the word "Preview" beside the version in Settings, About. It exists to prove that a Preview can be built, published as a pre-release and updated inside the app.
- Not yet tried: installing it, and updating from it to the next Preview or Stable.
