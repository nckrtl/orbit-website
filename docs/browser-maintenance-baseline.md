# PR-only maintenance browser baseline — Orbit 1262

## Review binding and intent

Independent discovery for group **1261**, subtask **1262**, thread **1190**.
All local browser results below were obtained before editing tracked files, at
`122b8a6f20b1d92209a1d8b6b4613bebe67e7cec`. Local `HEAD`, `main`, and the
already-fetched `origin/main` matched that SHA. The group-start-to-HEAD diff was
empty. No fetch, push, topology acquisition, provisioning, or activation occurred.

The operator's resolved brief defines one focused **CLEAN, PR-only maintenance
repair**, separate from AI-readiness. The prototype is reported as branch
`dot/maintenance-pr-only-20261005`, final head
`dd18cbb59fad60563f2b2d1fad1da20cf5e28658`, originally handed off by Dotty outside
Orbit Tasks through a Beast worktree/local Codex package. It is not on origin;
instance 346 is gone. `git cat-file -t` confirms the final object is unavailable
here. Its absence is not a prerequisite for reproducing main or a reason to
provision a replacement.

**Evidence attribution:** the historical matrix and duplicate-task reconciliation
below come from the operator relay, not a locally inspected prototype diff. The
operator identifies the filing as
`/workspace/orbit-task-filings/2026-10-06-resolve-1262/{history.md,RESULT.json,handoff/}`.
That path is not mounted in this workspace; the detailed relay is the source used
for this review. The relay states app code and existing browser tests were
identical between base and candidate, and the full 407-test suite was **not** rerun
at final head `dd18cbb5`. Do not describe that final head as browser-clean or
attribute existing failures to candidate application changes.

## Duplicate check

Local inspection:

```sh
git branch -a
git log --all --oneline --grep='browser\|repair\|prototype\|Beast\|maintenance' -i
git log --all --oneline -- tests/Browser scripts/BrowserTestRunner.php
git log --all --oneline -- tests/Browser/HeroIntroTest.php tests/Browser/CapabilityTabsTest.php
git show 3aa22a5 --stat
git log --all -p -- resources/js/components/orbit/inventory-drawing.tsx
git diff --stat 122b8a6f20b1d92209a1d8b6b4613bebe67e7cec..HEAD
```

No browser-repair/prototype branch or prior equivalent repair commit was found in
the available refs. Prior homepage and animation work already supplies extensive
regression coverage and should be preserved, not recreated. In particular:

- `3aa22a5` added Docs as the fourth primary-navigation item and updated
  `HomepageTest.php`, but left the header-count assertions in `HeroIntroTest.php`
  expecting five total anchors.
- `e90157b` (Sync the live orbit-website.test homepage) changed inventory labels from
  `nodes, apps, routes, tools, processes` to
  `nodes, apps, databases, routes, tools`. The tab test still looks for `processes`.

Available local Orbit session history did not supply the website prototype
handoff, and `orbit gateway:status` reported no active profile. The operator then
resolved the authoritative task-history gap: **project 33 has no prior
browser-repair Orbit tasks; 1261 is the sole repair group. Anna confirmed no
active duplicate.** Cancelled AI-readiness groups 1184/1172/1065 and dependency
group 63 are unrelated. This is attributed history, not a claim that a local
Gateway query independently returned those records. Do not duplicate those groups
or adopt the unrelated prototype machinery into this repair.

## Exact local execution and prerequisites

The existing installed Playwright is 1.63.0. Its required Chromium/headless-shell
revision 1243 was missing (only earlier revisions were present). No manifests,
lockfiles, PHP source, application code, or browser tests were changed to run the
baseline. Pest uses its disposable loopback application server, and the existing
browser runner builds both client and SSR assets, owns SSR on port 13719, and
sets `INERTIA_SSR_ENABLED=true` and `INERTIA_SSR_THROW_ON_ERROR=true`.

Commands, in execution order:

| Command                                                                                                                                                                                                                                                                                                                                                                        | Result / interpretation                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `composer test && composer analyse && vp check > .git/orbit/baseline-vp-check.log 2>&1`                                                                                                                                                                                                                                                                                        | Exit 0; 86 PHP tests, 528 assertions; PHPStan no errors; VitePlus passed.                                                                                                                                  |
| `composer test:browser > .git/orbit/baseline-browser.log 2>&1`                                                                                                                                                                                                                                                                                                                 | Exit 2; first failure `PlaywrightOutdatedException` at first visit, followed by cascading assertions; 407 failed / 0 assertions. Infrastructure prerequisite failure, **not** 407 application regressions. |
| `vp exec playwright install chromium > .git/orbit/playwright-install.log 2>&1`                                                                                                                                                                                                                                                                                                 | Exit 0; installed revision 1243 for the existing dependency. No dependency upgrade.                                                                                                                        |
| `composer test:browser > .git/orbit/baseline-browser-1.log 2>&1`                                                                                                                                                                                                                                                                                                               | Composer interrupted the command at its default 300-second timeout. Partial run is not a complete baseline. Only this attempt's owned orphan SSR/Pest/Playwright process tree was terminated.              |
| `COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='brings the navigation into focus' > .git/orbit/baseline-nav.log 2>&1`                                                                                                                                                                                                                                           | Exit 1; all four intro datasets failed; 6 assertions, 25.21 seconds.                                                                                                                                       |
| `COMPOSER_PROCESS_TIMEOUT=0 composer test:browser > .git/orbit/baseline-browser-2.log 2>&1`                                                                                                                                                                                                                                                                                    | Exit 1; **9 failed, 398 passed, 2403 assertions**, 568.29 seconds. Complete 407-case unchanged-main baseline.                                                                                              |
| `COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='joins rounded tab faces\|brings the navigation into focus\|fades the navigation backdrop\|connects the central server to the third section\|streams caused actions beneath a fixed log header\|paints the core logo inline' --log-junit=.git/orbit/baseline-focused.xml > .git/orbit/baseline-focused.log 2>&1` | Exit 1; **11 failed, 8 passed, 59 assertions**, 96.03 seconds. All nine stable cases failed again; connector wide and log mobile/reduced also failed.                                                      |
| `COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='connects the central server to the third section\|streams caused actions beneath a fixed log header\|paints the core logo inline' --log-junit=.git/orbit/baseline-intermittent-repeat.xml > .git/orbit/baseline-intermittent-repeat.log 2>&1`                                                                   | Exit 1; **1 failed, 9 passed, 43 assertions**, 41.80 seconds. Connector wide failed; log mobile/reduced and both logo themes passed.                                                                       |

The `\|` characters in the table represent literal regex alternation `|` inside
the quoted filter, not backslash characters to pass to Pest. Raw logs/JUnit remain
under `.git/orbit/` as local supporting artifacts; this document records the
commands and findings durably. Test-generated screenshots are disposable and are
not PR deliverables.

## Nine stable main failures — repair candidates

These are nine **dataset cases**, not nine different test functions. All failed
in the complete local baseline and the combined focused rerun.

| Cases | Exact test and datasets                                                                                                                                                                           | Failure site and classification                                                                                                                                                                                                                                                                                                                                                                   | In focused PR?                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2     | `tests/Browser/CapabilityTabsTest.php`: `it joins rounded tab faces with opaque thin sides and clean corners`; desktop (2135), mobile (390), height 1000, reduced motion                          | Assertion begins at line 45; its script at line 48 searches for removed label `processes`, then calls `querySelector` on `undefined`. The preceding backing/side/corner assertion passed. Stale label-dependent sizing assertion, **not demonstrated broken rounded geometry**. Current labels include `databases`; width is based on maximum measured label length after `document.fonts.ready`. | **Yes:** update the test's label/sizing contract against actual current labels, preserving equal widths, measured padding, rounded opaque sides, connector ordering, overflow and console checks. Do not revert app labels to make the test pass. |
| 4     | `tests/Browser/HeroIntroTest.php`: `it brings the navigation into focus promptly without moving`; desktop dark (2083), mobile dark (390), desktop light (2083), mobile light (390), height 1000   | Line 31 compound expression returns false; line 51 requires exactly five header anchors. Current header contains home + Story/Build/Setup/Docs + Get started = six. Static source/history identifies a stale assertion sufficient to fail every dataset; the compound failure alone does not prove all animation terms correct.                                                                   | **Yes:** reconcile the navigation contract including Docs, retain focus timing, opacity/blur, no movement, reduced-motion and mobile navigation/scroll assertions, and rerun to expose any remaining independent failure.                         |
| 3     | `tests/Browser/HeroIntroTest.php`: `it fades the navigation backdrop in on scroll and clears it at the top`; desktop (2135, animated), mobile (390, animated), reduced motion (2135), height 1000 | Line 337 compound expression returns false; line 344 also requires five header anchors instead of six. Initial transparent header and wash-on-scroll checks passed before this assertion. Stale header-count contract; no demonstrated backdrop regression from the aggregate boolean alone.                                                                                                      | **Yes:** reconcile with the current navigation while preserving wash/backdrop, positioning, opacity/filter, scroll reversal and console checks.                                                                                                   |

## Three intermittent cases — separate diagnostic scope

These stay separate from the nine stable cases. All three are **in scope for
1263 diagnosis**, including the currently unreproduced dark-logo case. The reported
matrix does not authorize declaring them fixed, candidate-caused, or out of scope.

Reported comparison labels: original harness base `122b8a6`, original candidate
`53202b1`, fixed-harness candidate `329f84f`, and base
`122b8a6 + harness329f84f`. These are operator-reported comparisons, not local
checkouts. Original full candidate `53202b1` had 12/407 failures. No equivalent
full-suite result exists for final candidate `dd18cbb5`.

| Exact case                                                                                                                                                                                                | Operator-reported paired evidence                                                                                                                                                               | Independent unchanged-main evidence here                                                                                                                                                                               | Classification / next diagnostic boundary                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/Browser/HomepageTest.php:704`, `it connects the central server to the third section without crossing either text block`, wide (2122 × 1000, reduced motion; declaration line 701)                  | Failed original focused base and fixed-harness focused candidate; passed original focused candidate and fixed-harness focused base. Baseline intermittency demonstrated.                        | Passed in the complete 407-case run; failed both subsequent focused runs at the line 705 geometry expression. Desktop/tablet/mobile passed those focused runs.                                                         | **Baseline-intermittent geometry/layout assertion. In scope.** Inspect readiness, route endpoint alignment, path/text intersection and settled layout independently; retain real geometry and overflow guarantees. No candidate-causation claim.                                      |
| `tests/Browser/HomepageTest.php:1711`, `it streams caused actions beneath a fixed log header and clips old rows`, mobile/reduced motion (390 × 1000; declaration line 1683)                               | Failed original full candidate and fixed-harness focused candidate; passed both focused bases and original focused candidate. Not reproduced on unchanged base in that reported focused matrix. | Passed complete suite; failed combined focused run at line 1711; passed the next focused repeat. Other three log datasets passed both focused runs. **Now independently reproduced intermittently on unchanged main.** | **Baseline-intermittent log/layout state assertion locally; historical base gap remains correctly qualified. In scope.** Separate fixed-header geometry from reduced-motion sequence/observer state and readiness; do not replace the behavior check with a sleep or remove coverage. |
| `tests/Browser/ThemeChoiceTest.php:166`, `it paints the core logo inline with strong contrast in both mobile themes`, dark (390 × 844, reduced motion; declaration line 158, geometry assertion line 167) | Failed original full candidate only; passed all four focused comparisons. Root cause/base reproduction unresolved, not fixed.                                                                   | Dark and light passed complete suite and both local focused runs.                                                                                                                                                      | **Reported intermittent failure, not locally reproduced. In scope for diagnosis.** Inspect viewport/scroll settlement, SVG bounds and contrast with console checks; preserve both themes. Passing reruns are not proof of a repair or candidate causation.                            |

## Exact bounded repair scope

This subtask records discovery only; it does not fix tests or application code.
For the following repair work:

1. Repair the demonstrated stale assertions in `CapabilityTabsTest.php` and
   `HeroIntroTest.php` without weakening their behavioral checks or changing
   current app content/navigation just to satisfy old expectations.
2. Diagnose **all three** intermittent cases above in 1263. Instrument individual
   failure predicates/readiness and repeat unchanged-main/candidate comparisons
   where useful. Make only evidence-supported test or minimal app changes needed
   for these browser contracts; preserve existing SSR, reduced-motion,
   mobile/desktop and light/dark guarantees. An unexplained passing rerun must
   remain explicitly unresolved, not be described as a fix.
3. Use existing tests and runner; keep build/SSR evidence tied to the actual PR
   head. Full browser validation, focused repeats and real-browser console/visual
   checks belong to the eventual UI-affecting repair, in addition to PHP tests,
   PHPStan and VitePlus. Correct assertion synchronization must not hide real
   rendering defects.
4. Do **not** bring in AI-readiness, dependency maintenance, new provisioning or
   activation flows, topology management, merge/deploy automation, Sabre runner
   changes, or GitHub App approval changes. Do not recreate instance 346, require
   the missing Beast object, or claim the final prototype received a complete
   407-test rerun. This remains one focused CLEAN PR, not prototype rollout.

## Validation boundary

This documentation-only review introduces no user-visible UI surface. Therefore
no new Pest Browser workflow test or manual UI-change verification is applicable.
The existing real-Chromium/SSR suite and focused runs above are baseline
reproduction, **not** post-repair/manual visual acceptance. Browser failures remain
intentionally present on unchanged main. Final review gates passed with
`composer test && composer analyse && vp check`: 86 PHP tests / 528 assertions,
PHPStan no errors, and VitePlus formatting/lint checks passed. The new review
Markdown was formatted with `vp check --fix` before this final gate rerun.
No approval/merge/deploy is performed by this subtask.
