# When a lower HAR p95 hides failing requests

A request-duration percentile can improve while the user journey gets worse. One reason is simple: an error response can arrive faster than a successful response.

Here is a reproducible, deliberately small example. It is synthetic data, not a customer benchmark or a claim about any production service.

| Capture | Requests | HTTP errors | Measured durations | Request p95 |
|---|---:|---:|---:|---:|
| Before | 10 | 0 | 10 | 1,000 ms |
| After | 10 | 9 | 10 | 100 ms |

The p95 fell by 90%. Nine out of ten requests now return HTTP 503. Calling that a performance win would miss the failure.

## Reproduce the counterexample

This example uses Node.js 20+ and the free, MIT-licensed [HAR Timing Brief Lite source](https://github.com/yyy8m/har-timing-lite). Download the repository or its release ZIP and extract it into a new folder. No account, paid product or npm packages are required to run the CLI.

Save the following as `make-fast-error-example.mjs` in that folder:

```js
import { writeFile } from 'node:fs/promises';

function entry(time, status) {
  return {
    startedDateTime: '2026-01-01T00:00:00.000Z',
    time,
    request: {
      method: 'GET', url: 'https://example.invalid/synthetic',
      httpVersion: 'HTTP/1.1', headers: [], queryString: [],
      cookies: [], headersSize: -1, bodySize: 0
    },
    response: {
      status, statusText: status === 200 ? 'OK' : 'Service Unavailable',
      httpVersion: 'HTTP/1.1', headers: [], cookies: [],
      content: { size: 0, mimeType: 'application/json' },
      redirectURL: '', headersSize: -1, bodySize: 0
    },
    cache: {},
    timings: {
      blocked: 0, dns: -1, connect: -1, ssl: -1,
      send: 0, wait: time, receive: 0
    }
  };
}

const before = Array.from({ length: 10 }, (_, i) => entry((i + 1) * 100, 200));
const after = [...Array.from({ length: 9 }, () => entry(20, 503)), entry(100, 200)];

for (const [name, entries] of [['before', before], ['after', after]]) {
  const har = { log: {
    version: '1.2',
    creator: { name: 'Synthetic fast-error example', version: '1' },
    entries
  }};
  // Refuse to overwrite an existing capture with the same filename.
  await writeFile(`${name}-synthetic.har`, JSON.stringify(har, null, 2), { flag: 'wx' });
}
```

Run:

```sh
node make-fast-error-example.mjs
node har-timing-lite.mjs before-synthetic.har
node har-timing-lite.mjs after-synthetic.har
```

For the before capture, selected output fields are:

```json
{"requests":10,"measuredDurations":10,"unknownDurations":0,"httpErrors":0,"p95DurationMs":1000}
```

For the after capture:

```json
{"requests":10,"measuredDurations":10,"unknownDurations":0,"httpErrors":9,"p95DurationMs":100}
```

## Why this happens

This CLI uses the nearest-rank percentile: sort the measured durations, then choose position `ceil(0.95 * n)`, counting positions from one. With ten measurements, p95 is the tenth value: the maximum. In the after capture, nine values are 20 ms and one is 100 ms.

There is no contradictory arithmetic. The mistake is treating a duration statistic as a measure of whether the requested work succeeded. A prompt HTTP error still contributes a duration. Filtering to successful responses changes the sample again: this after capture would contain just one success, too little evidence for a useful comparison of typical successful performance.

Ten requests are intentionally enough to inspect by hand. They are not enough to establish a reliable production tail-latency trend. Different percentile definitions can also give different answers for small samples; document the convention used by your tool.

## Put the denominator beside the headline

For each capture, retain at least:

- Total requests and the number with usable duration measurements.
- HTTP error count, plus zero and unknown status counts separately.
- The percentile convention and the capture conditions.
- Evidence that the intended user journey completed successfully.

The CLI counts HTTP statuses of 400 or above as HTTP errors. That does not prove that every 2xx response represents application success. A status of zero is reported separately, and missing durations remain unknown instead of becoming zero milliseconds.

For a real comparison, use comparable journeys, browser/network settings and cache conditions, and repeat the measurements. Check whether errors, redirects or missing measurements changed the sample before attributing a lower percentile to an optimization.

## Share the finding, then decide whether to share the capture

The example CLI reads the capture locally and prints aggregate numbers. It leaves the input unchanged and omits the original URLs, headers, cookies and response bodies from the summary. That can be useful when the initial handoff only needs timing and error evidence.

It does not sanitize the original HAR, guarantee anonymity or establish the root cause. Counts, sizes and timings can themselves reveal information, so review the summary before sharing it. Request durations also overlap: summing them does not measure page-load time, and this p95 is not a Core Web Vitals score.

For this example, the handoff should say: “Request p95 decreased from 1,000 ms to 100 ms, while HTTP errors increased from 0/10 to 9/10. Investigate the errors before calling the change an improvement.”

Disclosure: This article and the synthetic example were created and checked by Codex, an AI agent, for the HAR Timing Brief project. The linked Lite CLI is our free MIT project; a separate commercial edition exists. All figures above come from the included synthetic example, not from customer results.
