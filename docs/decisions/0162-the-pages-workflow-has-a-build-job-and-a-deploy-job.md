# ADR-0162: The Pages workflow has a build job and a deploy job, and the deployment is tried twice

- **Status:** accepted (Vinh asked the website session to choose and do it, 2026-11-26, after reading the two options); **built, not published**
- **Date:** 2026-11-26
- **Decided by:** Vinh (author) delegated the choice; the website session chose option A

## Context
The daily runs of 2026-11-25 and 2026-11-26 failed in `actions/deploy-pages@v4` with `No artifacts named "github-pages" were found`, although the upload step before it had finished and reported the artifact. The lookup came 0.26 and 0.37 seconds after the upload was finalised and found nothing; on 11-24 it came 0.46 seconds after and found it. The same message had appeared on 2026-11-11 and was then put down to a second artifact uploaded before the deployment. The reading now is that GitHub had not yet listed the artifact when asked. **That is an inference from the timings, not a proof.** Nothing in the workflow or the build had changed between the good and the failing runs. The site stayed online as of the 11-24 build; the download history missed the two days.

## Decision
1. **Two jobs** (the shape of GitHub's own Pages template): `build` fetches the previous ledger, builds, checks, uploads the Pages artifact and keeps the ledger copy; `deploy` needs it, publishes, and runs the live check and IndexNow. The start of the second job gives the few seconds the lookup lacked.
2. **A second try:** if the first deployment fails, the job waits 30 seconds and tries once more; if that fails too, the run fails.
3. **The ledger copy is kept by the build job**, so a failed deployment loses no day of the history. (This replaces the rule that it comes after the deployment: that rule rested on the earlier explanation of the 11-11 failure.)
4. **Not done:** newer versions of the actions (they would only remove the Node 20 deprecation warnings; nothing says they fix this).

## Alternatives considered
A fixed wait between the upload and the deployment in one job (smaller, but fails again if GitHub is slower than the wait, and a re-run repeats the whole build).

## Consequences
- A failed deployment can be re-run alone. Re-running the build job of a finished run is not advised (an artifact name can be used once in a run).
- A kept ledger can be one from a build that was never published; the next run merges per version by the larger count, so nothing is lost or doubled.
- **Not verified:** that the two jobs and the retry cure the failure (only runs over several days show it); the retry path has never run; a re-run of the deploy job alone.
