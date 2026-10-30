# Repo Reel implementation notes

Checked: 2026-10-30. Repo Reel reads public GitHub data in the user's browser; the application itself has no server, account flow, third-party runtime, or analytics.

## API sources

- [GitHub REST: repository contents/README and repositories](https://docs.github.com/en/rest/repos/repos): public repository metadata and README content are fetched by owner/name.
- [GitHub REST: list commits](https://docs.github.com/en/rest/commits/commits#list-commits): the app requests up to 100 commits for the default branch and groups those visible commit dates into 12 weekly buckets. It is a sample, not a full-history chart.
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api): unauthenticated public-data requests have a primary limit of 60 requests/hour per originating IP. One reel consumes about four requests, subject to cache/endpoint behavior and API failures.

## Export implementation and limits

The story is drawn to a Canvas. GIF uses a small local palette and an in-project LZW writer with no dependency. Its palette and low frame size trade fidelity for a self-contained export. The MP4 button is enabled only when the current browser reports an H.264/MP4 `MediaRecorder` type; support varies by platform. This version does not promise MP4/WebCodecs support in every browser. Private repositories are intentionally unsupported; no PAT or OAuth secret is embedded in client-side code.

The browser fetches data from GitHub's public API and renders the reel locally. It does not upload the video or publish it. A story can contain truncated or missing README/code excerpts; inspect the preview before sharing.
