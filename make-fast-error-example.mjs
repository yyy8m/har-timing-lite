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
