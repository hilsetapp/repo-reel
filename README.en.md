**English** | [Русский](README.md)

# Repo Reel

Turn a public GitHub repository into a short vertical trailer with its description, stars, README highlights, a code sample, and recent commit rhythm. Public data comes from GitHub's API; the reel is rendered and exported in the browser. No account or server required.

## Run

Open `index.html`, or start a local server:

```bash
python3 -m http.server 4174
```

Visit `http://localhost:4173`. No build step or external libraries required.

## Export and browser support

- GIF is encoded locally from Canvas without an external library.
- MP4 is offered only if the browser reports MP4/H.264 support through `MediaRecorder`. Support depends on browser and operating system; it is not guaranteed. If unavailable, export a GIF.
- The trailer is 30 seconds in a vertical 9:16 format. GIF has a limited palette; it is compatible but can be large.

## Data and limits

Repo Reel supports public GitHub repositories. It requests data from `api.github.com`; unauthenticated GitHub API access is rate-limited. Private repositories are not supported. READMEs can be very long, sparse, or difficult to summarize; review the preview before export. The activity chart uses at most the latest 100 commits and is not a full project history.

The reel is generated locally. Repo Reel does not upload the video or publish it on your behalf. The video includes a “Made with Repo Reel” credit and a link to the source repository.

## Tests

```bash
npm test
```
