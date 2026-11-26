# ADR-0162: The Pages workflow has a build job and a deploy job, and the deployment is tried up to three times

- **Status:** accepted (Vinh asked the website session to choose and do it, then to add the third try and push, 2026-11-26); **built and pushed**
- **Date:** 2026-11-26
- **Decided by:** Vinh (author) delegated the choice; the website session chose option A

## Context
The daily runs of 2026-11-25 and 2026-11-26 failed in `actions/deploy-pages@v4` with `No artifacts named "github-pages" were found`, although the upload step before it had finished and reported the artifact. Nothing in the workflow or the build had changed since the last good run. The site stayed online as of the 11-24 build; the download history missed the two days.

**Cause (reported upstream, `actions/deploy-pages#451`):** the list of artifacts the action asks is sometimes behind the upload. Others measured under a second to a few seconds, once about 46 seconds, and one project found 60 seconds enough; an immediate second try reads the same stale list. Reports became frequent around 2026-11-22.

**A reading made first and found wrong:** that our two failures asked too soon after the upload. Over 117 earlier runs the action asked after 213 to 504 ms and found the artifact, and at least 23 of them asked as soon as or sooner than the two that failed. How soon we ask does not explain it; the lag is on GitHub's side and varies.

## Decision
1. **Two jobs** (the shape of GitHub's own Pages template): `build` fetches the previous ledger, builds, checks, uploads the Pages artifact and keeps the ledger copy; `deploy` needs it, publishes, and runs the live check and IndexNow. The start of the second job gives the few seconds the lookup lacked.
2. **Up to three tries:** if the first deployment fails, the job waits 30 seconds and tries again; if that fails too, it waits 60 seconds and tries a third time; if the third fails, the run fails. A good run is not slowed.
3. **The ledger copy is kept by the build job**, so a failed deployment loses no day of the history. (This replaces the rule that it comes after the deployment: that rule rested on the earlier explanation of the 11-11 failure.)
4. **Not done:** newer versions of the actions (they would only remove the Node 20 deprecation warnings; nothing says they fix this).

## Alternatives considered
A fixed wait between the upload and the deployment in one job (smaller, but fails again if GitHub is slower than the wait, and a re-run repeats the whole build).

## Consequences
- A failed deployment can be re-run alone with **Re-run failed jobs**. **Re-run all jobs must not be used**: it uploads a second artifact of the same name and the deployment then fails for that run.
- The tries wait about 90 seconds in all. A lag longer than that still fails the run (the daily run of the next day, or a manual run, recovers).
- A kept ledger can be one from a build that was never published; the next run merges per version by the larger count, so nothing is lost or doubled.
- **Not verified:** that the change cures the failure (only runs over several days show it); the retry steps, which run only when a deployment fails; a re-run of the deploy job alone.
