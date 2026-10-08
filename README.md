# HAR Timing Brief Lite

Create a small numeric performance summary before you hand a network capture to someone else.

A HAR file may contain request URLs, headers, cookies and response bodies. This dependency-free CLI reads a HAR **on your own computer** and prints a JSON summary without those original fields. It does not rewrite or sanitize the original HAR.

**Node.js 20+ · MIT license · no packages · no network calls**

[日本語の使い方](README.ja.md) · [Handoff guide](GUIDE.md)

## Try a synthetic example

Download this repository or [the free ZIP (documentation revision 1)](https://github.com/yyy8m/har-timing-lite/releases/download/v1.0.0/har-timing-lite-github-1.0.0-docs1.zip), then run:

```sh
node har-timing-lite.mjs examples/sample.har
```

Selected fields from the included fictional capture:

```json
{
  "requests": 3,
  "httpErrors": 1,
  "medianDurationMs": 650,
  "p95DurationMs": 1800
}
```

The actual JSON also includes measurement coverage, unknown-value counts, body-byte totals and other timing statistics. These sample values demonstrate the format; they are not customer results.

For your own capture:

```sh
node har-timing-lite.mjs capture.har > summary.json
```

## Useful when

- A bug report needs request counts, error counts and timing evidence, but the raw capture cannot be shared.
- You want a dependency-free command for a local performance handoff.
- You need missing measurements to remain unknown rather than turning into misleading zeros.

Review the summary before sharing it. Timing, sizes and counts can still be sensitive. Keep your original capture private so you can investigate specific requests locally.

## What this does and does not do

| Question | Lite behavior |
|---|---|
| Upload my HAR? | No. It reads a local file. |
| Modify the original? | No. Output is written to stdout. |
| Copy URLs, headers or response content? | No. Only aggregate numeric fields and fixed labels are printed. |
| Guarantee anonymity? | No. Retained metadata can still be sensitive. |
| Measure page load time or Core Web Vitals? | No. Request durations overlap and are not page load time. |
| Prove why a site is slow? | No. This is a summary, not a root-cause diagnosis. |
| Compare specific endpoints or replay traffic? | No. Use an appropriate detailed inspector locally for that task. |

Accepts HAR 1.2, up to 32 MiB and 100,000 entries. Invalid or missing measurements are tracked as unknown. The CLI reports a generic error instead of printing input contents or paths.

## A careful handoff

1. Record the user journey, cache state, browser and network conditions separately.
2. Run more than one capture when comparing a change.
3. Read error counts and measurement coverage alongside p95. Fast failures can look like a timing improvement.
4. Share only what the recipient needs and retain the original capture locally.

## Optional HTML and comparison kit

Lite is useful on its own and remains MIT-licensed. If you need readable HTML reports, whole-capture before/after comparisons or batch processing, the separate [HAR Timing Brief kit](https://hartimingcodex.gumroad.com/l/har-timing-brief) is USD 19 before applicable taxes.

[Inspect an actual report and compare editions](https://har-timing-brief-codex.yousuke-c5.chatgpt.site/examples/) before buying. English/Japanese setup instructions are included. The paid kit is commercially licensed and is not part of this repository.

## Verify locally

```sh
node test/smoke.mjs
```

Please report problems using synthetic inputs only. Never attach a real capture, credentials, cookies or private URLs to a public issue. Tests use fictional data and require no network access.
