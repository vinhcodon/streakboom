# Documentation map

Each kind of statement has one home. Before adding a sentence, decide which kind it is.

| Kind | Home | Question it answers | Changes when |
|---|---|---|---|
| **The whole project, for someone coming cold** | [`PROJECT.md`](PROJECT.md) | What is this, why, in what state, by what rules, and where is everything? | every release, and whenever a fact it states changes (ADR-0070); it points at the owners and never replaces them |
| What Peak does and how to use it | [`features.md`](features.md) | What can a person do with it? | the product changes |
| What the dependencies are licensed under | [`dependency-licenses.md`](dependency-licenses.md) | Is every component open source, and which licenses are in the build? (a SignPath condition) | a dependency is added or changed; before an application for signing |
| What it reads, keeps and sends | [`privacy.md`](privacy.md) | What does Peak know about me? | a sense, a file or a thing sent changes (also the README promise and the website) |
| How to build and run it | [`development.md`](development.md) | How is the repository laid out and how do I run the tests? | the layout or the commands change |
| How a release is made | [`releasing.md`](releasing.md) | How is a version signed, published and checked, and what is done after? | the release process changes |
| The website | [`website.md`](website.md) | How is the site built and checked? (owned by the website session) | the site build changes |
| How the product works now | [`../spec/`](../spec) | What does it do, and how is it built? | the product changes |
| Principles | [`charter.md`](charter.md) | What is Peak for, and which rule wins when two conflict? | a new decision record changes it (ADR-0047) |
| Decisions | [`decisions/`](decisions/README.md) | What did we choose, why, and what did we reject? | a choice is made or reversed (new record; old one marked superseded) |
| Evidence | [`foundation/`](foundation/README.md) | What does the research say, with what confidence, and what is still unknown? | better evidence arrives (cite source and date; a rule changes only by an ADR, ADR-0058) |
| Hypotheses and assumptions | [`hypotheses/`](hypotheses/README.md) | What do we believe but not know, and what would settle it? | evidence arrives |
| Handoffs | [`handoff/`](handoff/README.md) | What did another session or conversation tell us? | never edited after receipt; the index records what became of it |
| Plans | [`plans/`](plans/README.md) | What will we do next, in what order, tested how? | work starts or finishes |
| History | [`engineering-log.md`](engineering-log.md) | What was built, measured and learned, and what was not verified? | appended, never rewritten |
| Open checks | [`plans/verification-debt.md`](plans/verification-debt.md) | What was built but not yet checked, and how to check it? | after every task; a row is ticked or removed when checked |
| Release notes | [`../CHANGELOG.md`](../CHANGELOG.md) | What does each version change for the user? | at every release (the website reads it) |

## Keeping them in step
1. A change to behavior updates the spec in the same commit as the code, and the README if users see it.
2. A choice between options gets an ADR. A belief that is not proven goes in the hypotheses register, with the evidence that would settle it.
3. When a hypothesis is settled, update its status and write an ADR if the product changes.
4. Numbers that appear in several places (test counts, line counts, versions) are updated together; the specs and the README state them, so check them at each release.
5. Say what was **not** verified. Every plan and log entry ends with it.
6. Commit documents with explicit paths, like code (ADR-0023).
7. **At every release** audit the documents for consistency, refresh the README **and the snapshot and section 4 of `PROJECT.md`**, check the names, and prepare the prompt for the website session (ADR-0033, ADR-0070; `node scripts/audit-docs.mjs`, which also fails if the snapshot names an old version, the README grows past its limit, a document in `docs/` is not named here, or an ADR number has two rows).
8. **The README is a front door, not the record.** It is short (the audit caps it) and the same facts live in the documents above; the website reads a few of its sentences (see the pitfalls in `PROJECT.md`), so change those only with the website session.
9. **Contributor entry points** (`../AGENTS.md`, `../CONTRIBUTING.md`, `../SECURITY.md`, `../CODE_OF_CONDUCT.md`, the issue and pull request forms in `../.github/`) change when the rules or the commands they state change; the CI workflow (`../.github/workflows/ci.yml`) when the checks change.
