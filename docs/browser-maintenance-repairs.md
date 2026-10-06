# Intermittent browser-test repairs — Orbit 1263

## Scope and contract

This follows the approved discovery in `browser-maintenance-baseline.md`, on
`d19cfcd115a58639d586327fa8124a3e6cec95cb` (application/tests still equal to group
base `122b8a6f20b1d92209a1d8b6b4613bebe67e7cec`). Only the setup of the three
identified tests changes. No application, runner, dependency, screenshot
baseline, infrastructure, activation, or deployment changes are included.

Each test checks behavior **at a specified viewport**, not a live resize
transition. Previously `visit('/')->resize(...)` navigated at Pest's default
desktop viewport and then resized while hydration/responsive effects could be
running. Now the same dimensions are supplied as `visit()`'s `viewport` option.
The installed Pest Browser `PendingAwaitablePage::buildAwaitablePage()` passes
these options to `newContext()` before `newPage()->goto()`. SSR remains enabled
through the unchanged project browser runner.

All original assertions, tolerances, observation durations, observers, datasets,
reduced-motion options, theme-selection interactions, JavaScript-error checks,
and console checks are unchanged. No retries, sleeps, or broad readiness helper
are added. Existing waits remain exactly as they were.

**Boundary:** this corrects the initial-viewport test setup; it does not repair or
claim coverage of application behavior when resizing during hydration. The
persistent connector mismatch observed under the old setup is a real rendered
mismatch, not merely a floating-point error. It is retained here as a separate
startup/live-resize finding, not declared an application fix. Review must assess
this distinction rather than infer that every responsive transition is correct.

## Reproduction and predicate diagnosis

Disposable diagnostic tests used the original setup and evaluated individual
predicates in real Chromium against the existing SSR build. Sources and raw logs
are retained locally under `.git/orbit/repair-fixtures/` and `.git/orbit/`;
fixtures are not part of the PR or final suite.

### Connector — HomepageTest

With the original 2122 × 1000 reduced-motion setup, six independent visits gave
three mismatches and three correct routes. In mismatches:

- Source endpoint error was about 0.000049px; **target error was 17.200035px**.
- There were no sampled text-block intersections and no horizontal overflow.
- `document.fonts.status` was already `loaded`. Awaiting `document.fonts.ready`
  and two animation frames did **not** repair the cached mismatch.
- The incorrect path ended at local x=1390.644432; the correct path ended at
  x=1407.844444. This is not an assertion-tolerance problem.

`StoryHandoff` caches port/layout measurements and redraws through scheduled
resize/scroll frames; responsive scene/entrance effects also adjust SVG/layout.
A post-navigation resize mixes their initial measurements. Six equivalent visits
with the target viewport established before navigation all had target error
about 0.000038px, no crossings, and no overflow. The committed test still checks
both port attachments within 0.5px, the entire sampled route against both text
blocks, and overflow at all four original widths.

Logs: `repair-diagnostic.log`, `repair-diagnostic-viewport.log`.

### Fixed log header — HomepageTest

Six original mobile/reduced-motion diagnostic visits exposed page movement,
not unexpected log streaming:

- Sequence remained `0` throughout.
- In two samples the header moved from y=-1020.793640 to -924.793640, while
  scrollY changed from 7606 to 7510 and document height dropped by 96px.
- Other samples scrolled using a still-changing responsive layout, with a
  header initially near y=334.487335 and later near y=-924.793640.
- This explains why the combined `fixed && reduced-motion-state` assertion
  failed even though the reduced-motion sequence was unchanged.

With mobile set before navigation, six samples all had header y=326.206360,
scrollY=6259, and sequence `0` both before and after 3.8 seconds. The committed
test still checks the fixed header, clip path, eight rows, streaming/time changes,
negative entry offset and final resting transform when animated, no sequence or
observer change when reduced, and pausing after scrolling away. Both original
widths and motion modes remain covered.

Logs: `repair-diagnostic.log`, `repair-diagnostic-viewport.log`.

### Mobile core logo — ThemeChoiceTest

The original `LogoDiagnosticTest.php` used a **nearby configuration**, not the
exact original setup: post-navigation 390 × 900 with `colorScheme=dark`, versus
390 × 844 with no explicit `colorScheme` in the production test. That diagnostic
exposed a logo at y=-1661.723267 (later -1662.004517), with valid SVG size/shape and
black fill against a white face. It suggested an offscreen-scroll explanation,
but did **not** establish the failed predicate of the original configuration.
Its attribution is corrected here; `repair-logo-diagnostic.log` is only
nearby-configuration evidence.

A temporary `.repeat(12)` on the **unchanged original** test body, selecting dark
alone, reproduced the composite assertion failure: **1 failed / 11 passed,
46 assertions** (`repair-logo-before-dark.log`). That run by itself did not
identify which conjunct failed. Running light before dark passed 24/24; its menu
interaction changes timing, so that result alone would have missed the
cold-dark failure. The repaired dark-only run passed 12/12.

#### Exact-setup predicate evidence after review

`ExactLogoDiagnosticTest.php` now uses precisely the original dark branch:

```php
$page = visit('/', ['reducedMotion' => 'reduce'])->resize(390, 844);
$page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true);
$page->script('document.querySelector(".orbit-foundation__drawing").scrollIntoView({block:"center",behavior:"instant"})');
```

There is no explicit `colorScheme`, theme-menu interaction, added wait, or
additional scroll. The original logo assertion's entire return expression is
unchanged. The diagnostic records geometry/styles and each predicate within
that same evaluation, then prints those stored samples in `finally`; failures
are not caught or suppressed. Instrumentation can affect timing, so all runs
are reported, not only the failing one.

Six independent runner invocations each used 12 visits. The first five passed
12/12 (48 assertions each); the sixth reproduced **1 failed / 11 passed,
46 assertions**. In that failed visit, the **only false predicate was
`box.top >= 0`** throughout all 4940 assertion evaluations:

- First sample: viewport 390 × 844, appearance `dark`, box.top=-1717.723267,
  box.bottom=-1698.871704, scrollY=11980, document height=12824.
- Last sample: box.top=-1717.004517, box.bottom=-1698.152954, scrollY=11883,
  document height=12728. The logo remained offscreen throughout the assertion
  timeout; its position did not recover merely by waiting.
- Both samples: `path`, length=400.562012, width=32.651947,
  height=18.851562, black fill versus white face, filter/stroke=`none`,
  no legacy server corner, fonts=`loaded`. All other original conjuncts passed.

A paired diagnostic changed **only** the setup to the repaired initial
390 × 844 viewport, keeping the same options and tracing/return expression:
**12 passed / 48 assertions**. All predicates passed, with box.top from
439.589203 to 439.995453 and box.bottom from 458.440796 to 458.847046.
This establishes visibility after the setup scroll as the failed predicate,
with responsive layout/scroll settlement under the original resize setup as
the cause—not loss of contrast, shape, size, or theme state. It does not claim
to fix arbitrary live resize behavior in the application.

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='diagnoses exact original dark logo predicates'
# Run six times, each independently starting the existing runner.
# repair-logo-exact-original.log and repair-logo-exact-original-{2,3,4,5,6}.log
# Run 6: 1 failed / 11 passed / 46 assertions.
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='diagnoses repaired dark logo predicates'
# 12 passed / 48 assertions — repair-logo-exact-repaired.log
```

The failing first/last samples and failed-predicate set are summarized in
`.git/orbit/repair-logo-exact-original-summary.json`; complete samples remain in
`repair-logo-exact-original-6.log`. Diagnostic sources are retained in
`.git/orbit/repair-fixtures/{ExactLogoDiagnosticTest,RepairedLogoDiagnosticTest}.php`.
Both themes and all production predicates remain asserted, with no screenshot
expectation changes.

## Exact validation commands and results

All browser commands use the existing build + owned SSR + disposable Pest server
runner. No topology was acquired or released. No fetch or push occurred.

Focused run immediately after each respective setup repair:

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='connects the central server to the third section'
# 4 passed / 16 assertions — repair-connector-focused.log
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='streams caused actions beneath a fixed log header'
# 4 passed / 20 assertions — repair-log-focused.log
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='paints the core logo inline'
# 2 passed / 9 assertions — repair-logo-focused.log
```

Disposable copies of the repaired bodies, with `.repeat(3)` for each connector
and log dataset and `.repeat(12)` for each logo theme, were used only to validate
independent visits (not retries until success):

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='RepairRepeatTest'
# 48 passed / 216 assertions — repair-repeated.log
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='RepairRepeatTest.*paints the core logo inline.*dark'
# 12 passed / 48 assertions — repair-logo-after-dark.log
```

### Assertion sensitivity

Disposable copies attempted perturbations without changing the assertion body:
a connector transform, a 10-SVG-unit header translation after its baseline
sample, and a logo fill matching its face. The prior report reversed the
connector and header/logo result attribution. The actual recorded results are:

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='injected defect'
# repair-injection-corrected.log: 6 failed / 4 passed / 31 assertions.
# Connector: 4 failed. Header: 2 failed / 2 passed. Logo: 2 passed.
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='injected defect: connects'
# Separate CSS-transform injection: 4 failed / 8 assertions.
# repair-injection-connector.log
```

Thus connector sensitivity was demonstrated in both recorded runs, and the
header perturbation triggered failures in only two datasets. **Sensitivity to
that perturbation is unproven for the other two header datasets and both logo
themes.** Their passing injection runs are not evidence that the assertions
reject those defects: effective persisted perturbations were not measured.
No explanation such as CSS overriding a particular injection is established by
these logs, and no all-dataset sensitivity claim is made. The production
assertions remain unchanged; exact-setup logo predicate tracing above is
root-cause evidence, not a contrast-injection sensitivity result.

An earlier malformed disposable injection fixture accidentally changed visit's
URL; its protocol-error run (`repair-injection.log`) is **not** assertion-sensitivity
evidence. All injection/diagnostic/repeat fixtures were removed from
`tests/Browser/` before the recorded full-suite validation. The new exact-setup
diagnostics were also removed before final focused/project-gate validation.

### Real-browser inspection boundary

An additional disposable Playwright-backed Pest session visited the repaired
wide connector and mobile log surfaces, scrolled to their drawings, sampled the
log after 3.8 seconds, and visited the mobile logo in dark and light (using the
actual theme menu). It captured viewport screenshots and passed all JavaScript
and console checks: **1 passed / 11 assertions**.

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='captures repaired browser surfaces'
# repair-manual-corrected.log; fixture: repair-fixtures/RepairManualTest.php
```

The first inspection fixture attempted to open the top navigation while scrolled
to the foundation and timed out; returning to the top before theme selection
corrected that fixture only. It is not evidence of a repaired application bug.
The previously advertised `.git/orbit/repair-screenshots/` directory is absent;
those captures are **not retained artifacts available to the reviewer**. The
prior path/availability claim is withdrawn. The session log and fixture record
screenshot calls and passing console checks, not current screenshot availability
or visual acceptance. The agent's image reader reported that the current model
could not view images; **human visual acceptance is not claimed**. Real-browser
geometry/state and console validation passed. No user-visible application UI was
changed by this test-only repair, so additional manual UI-change acceptance is
not applicable.

## Preserved baseline and completion gates

The nine stable unchanged-main failures remain findings, not repaired assertions:

- `CapabilityTabsTest`: rounded tab faces, two datasets (stale inventory label).
- `HeroIntroTest`: prompt navigation focus without movement, four datasets.
- `HeroIntroTest`: navigation backdrop fade/clear, three datasets.

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser
# 9 failed / 398 passed / 2403 assertions; 427.69 seconds; exit 1.
# repair-full-browser.log
composer test && composer analyse && vp check
# Passed: 86 PHP tests / 528 assertions, PHPStan no errors, VitePlus passed.
vendor/bin/pint --test tests/Browser/HomepageTest.php tests/Browser/ThemeChoiceTest.php
# Passed for both edited PHP files.
```

After the review's evidence corrections, final focused validation also passed:

```sh
COMPOSER_PROCESS_TIMEOUT=0 composer test:browser -- --filter='connects the central server to the third section|streams caused actions beneath a fixed log header|paints the core logo inline'
# 10 passed / 45 assertions — repair-evidence-revision-focused.log
composer test && composer analyse && vp check
# Passed again after the evidence revision: 86 PHP tests / 528 assertions,
# PHPStan no errors, VitePlus passed.
# repair-evidence-revision-{test,analyse,vp-check}.log
```

The complete 407-case post-repair browser run has exactly the same nine stable
failures listed above; all ten datasets of the three repaired tests passed.
This is not a claim of a green browser suite or validation of the unavailable
Beast prototype. Application/runner sources are unchanged. The final diff keeps
the baseline report and stable failing tests intact.

Independent **repair-review** confirmation is requested for each setup repair:
compare the before/after predicate evidence and unchanged assertion bodies,
confirm that initial-viewport contracts justify removing the incidental resize,
and assess the explicitly qualified sensitivity/visual evidence boundaries.
No reviewer confirmation is self-issued by this implementation report.
