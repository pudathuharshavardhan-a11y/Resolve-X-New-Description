# Resolve-X redesign

This package replaces the existing website's `index.html`, `style.css`, and `script.js` with a redesigned incident-management dashboard.

## Included
- Responsive dark dashboard and light/dark toggle
- Guided incident assistant with one-question-at-a-time intake
- Suggested severity classification (rule-based demo)
- Incident list with search, severity/status filters, and status updates
- Dashboard statistics and charts
- CSV and JSON exports
- Browser-local incident storage

## Replace the existing website
1. Download and extract this ZIP.
2. Open your `resolve-x` repository on GitHub.
3. For each of `index.html`, `style.css`, and `script.js`, open the file, click the pencil (Edit), replace its contents with the matching file from this package, and commit. Alternatively, upload the three files and confirm replacing the existing files.
4. Wait for GitHub Pages to publish the changes, then refresh your website.

The `index.html` is the main entry page, so visit the repository's normal GitHub Pages URL.

## Important limitations
The assistant is a guided, rule-based prototype, not a live AI model. It stores records in the current browser only; there is no shared database, login, real monitoring, or backend. Do not enter secrets or sensitive incident information. To add live AI, connect a secure backend and keep API keys off the frontend.
