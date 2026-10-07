# Sharing HAR performance findings without sharing request contents
A HAR capture is useful for troubleshooting, but a colleague who only needs timing information may not need the original URLs, headers or response bodies.

Chrome's Network panel offers sanitized HAR export. Its documentation describes omission of sensitive headers such as Cookie, Set-Cookie and Authorization. That is useful, but it is a different goal from creating a minimal performance summary.
Source: https://developer.chrome.com/docs/devtools/network/reference

For a performance handoff, start by deciding what evidence is needed: request counts, error statuses, durations, wait times and body sizes. Build a new report from these fields rather than copying the entire capture and searching for suspicious strings.

A request label like R000042 can point to entry 42 in the capture you keep locally. The report recipient can ask about that label without receiving the original endpoint.

Be careful with the measurements. Missing HAR values are not zero. p95 over five requests is a very different observation from p95 over thousands. Request timings overlap, so adding them does not measure page load time. A lower p95 can even accompany more fast error responses.

Capture comparable journeys before and after a change. Keep cache state, browser and network conditions comparable. Repeat measurements before attributing a difference to a code change.

HAR Timing Brief follows this minimal-report approach. The free edition produces a local JSON summary. The paid kit adds readable HTML, capture comparisons and batch processing. Both leave the source capture on your machine.

Run the included example with: node har-timing-lite.mjs examples/sample.har. The sample contains synthetic data only. No purchase is required to use this free edition. Get the full toolkit at https://hartimingcodex.gumroad.com/l/har-timing-brief .


