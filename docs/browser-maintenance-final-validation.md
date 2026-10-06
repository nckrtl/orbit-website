# Final maintenance validation — Orbit 1264

## Candidate and scope

Validation started at local `HEAD` and already-fetched `origin/task-1261`
**`baa9a5006a24609227e087e47275a74909c4e210`**, against group base and
`origin/main` **`122b8a6f20b1d92209a1d8b6b4613bebe67e7cec`**.
No fetch or push occurred. This report is a documentation-only addition after
that run; the tested application, runner and test sources remain unchanged.
Publication of this report will require binding the successor remote PR head
and obtaining an independent final review, not reusing approval of an older SHA.

The base-to-candidate diff contains only the two preceding evidence documents
and three initial-viewport setup changes in `tests/Browser/HomepageTest.php` and
`tests/Browser/ThemeChoiceTest.php`. This report is the fifth changed file.
The assertion bodies, datasets, timing, screenshots and tolerances are unchanged.
`git diff --check 122b8a6..HEAD` passed before this report was added.

There are **no application, dependency, runner, activation, live-runner isolation,
GitHub Actions integration, GitHub App approval, Sabre, provisioning, merge or
deployment changes**. No topology was acquired or released. This is a focused
PR-only test repair, not a recovered or validated Beast prototype. The historical
prototype `dd18cbb59fad60563f2b2d1fad1da20cf5e28658` is still unavailable locally.

## Commands and evidence

Logs below are task-local artifacts under `.git/orbit/`, not committed files.

| Command                                                                                                                                          | Result                                                                                                                    | Artifact                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `composer test && composer analyse && vp check`                                                                                                  | Exit 0; **86 PHP tests / 528 assertions**; PHPStan no errors; 99 formatted files, 81 linted files without warnings/errors | `final-project-gates.log`                           |
| `COMPOSER_PROCESS_TIMEOUT=0 composer test:browser`                                                                                               | Exit 1; **all 407 tests ran: 10 failed / 397 passed / 2401 assertions**, 454.69 seconds                                   | `final-full-browser.log`, `final-full-browser.exit` |
| Client and SSR builds, invoked by that complete browser command                                                                                  | Both passed; existing `@inertiajs/vite` SSR sourcemap warning remains                                                     | `final-full-browser.log`                            |
| `vp exec tsc --noEmit`                                                                                                                           | Exit 0                                                                                                                    | `final-typescript.log`                              |
| `vendor/bin/pest tests/Unit/BrowserTestRunnerTest.php tests/Unit/PestRunnerTest.php tests/Feature/ContentSecurityPolicyTest.php`                 | Exit 0; **14 tests / 44 assertions**                                                                                      | `final-harness-security.log`                        |
| `.git/orbit/final-tools/actionlint -oneline`                                                                                                     | Exit 3: no workflows directory/project found; **not a passing workflow validation**                                       | `final-actionlint.log`                              |
| `COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='fades and blurs buttons then paragraph then title then grouped labels on scroll'` | Exit 0; 2 passed / 8 assertions                                                                                           | `final-extra-failure-focused-corrected.log`         |

Actionlint v1.7.7 was installed into the task's private artifact directory using
`GOBIN="$PWD/.git/orbit/final-tools" go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.7`.
There are no tracked `.github` files at this candidate. Adding workflows solely
to produce a green actionlint result would violate the PR-only scope.

The reported **31 harness/security tests** belong to the unavailable prototype,
not a discoverable 31-case suite in this checkout. The existing local runner/CSP
subset above passes, and is also included in the unchanged 86-test PHP suite.
**31 tests are not independently confirmed**; 14 is not a claimed equivalent or
a legitimate reduction of that historical suite. No tests were deleted or added.
PHP counts remain exactly 86 / 528.

## Browser limitations, including the additional final-run failure

The nine previously documented unchanged-main failures all remain:

- `CapabilityTabsTest.php:45`: rounded tab faces, two datasets; stale inventory
  label assertion. See the baseline report for source-history attribution.
- `HeroIntroTest.php:31`: prompt navigation focus without movement, four
  datasets; stale five-anchor assertion versus the current six-anchor header.
- `HeroIntroTest.php:337`: navigation backdrop fade/clear, three datasets; the
  same stale anchor count within the compound expression.

The final run also failed the **first dataset (wide desktop, 2083 × 1214)** of
`HeroIntroTest.php:125`, “fades and blurs buttons then paragraph then title then
grouped labels on scroll”, at line 176: `window.heroExitCheckPassed` was false.
The short-desktop dataset passed. This is **an additional observed failure**,
not one of the previously established nine stable findings. The exact focused
rerun passed both datasets. An initial mistyped filter found no tests and exited
1 (`final-extra-failure-focused.log`); it is not validation evidence.

`HeroIntroTest.php`, all application sources, assets' source configuration and
runner sources are byte-identical to group base. No changed test modifies this
separate visit's setup. This supports treating the extra observation as an
unchanged-code intermittent finding, but its failed internal predicate/root
cause and a separate unchanged-main reproduction are **not established**.
It is not silently relabelled as a stale-count failure, repaired, retried away,
or grounds to weaken its assertions. The final complete run remains 10 failures,
even though the subsequent focused run passed. The two fewer assertions versus
the prior 9-failure / 2403-assertion run reflect this extra test stopping at its
compound assertion before its JavaScript/console checks.

All ten datasets of the three repaired tests passed in the complete run.
This does not claim a green browser suite. Earlier focused/repeated diagnostics
and real Playwright-backed geometry/state/console validation are documented in
`browser-maintenance-repairs.md`, including the limitations of injection
sensitivity and unavailable screenshots. This subtask adds documentation only;
there is no new user-visible UI surface requiring a new manual UI workflow.

## PR publication and independent review boundary

The already-fetched branch head above is **not proof of an open PR's GitHub head**.
A read-only `gh api 'repos/nckrtl/orbit-website/pulls?state=open'` attempt exited
4 because no GitHub CLI credentials/token are available (`final-pr-metadata.err`).
No GitHub state was changed. No PR URL, remote successor SHA, independent CLEAN
verdict or review publication is self-issued here.

Orbit owns publication of the approved commit. The reviewer/publication owner
must supply the real open PR URL and exact published head (including this report)
and independently confirm the focused diff, full-run evidence and explicit
limitations. The 31-test historical claim, actionlint non-applicability and
additional intermittent observation must remain disclosed in the PR body.
Approval never authorizes activation, merge or deployment.
