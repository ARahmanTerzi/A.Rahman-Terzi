# AGENTS.md

## Cursor Cloud specific instructions

This is a plain static HTML/CSS portfolio website with no build system, package manager, or backend.

### Structure
- `index.html` — Homepage with profile photo and bio
- `resume.html` — Resume/CV page
- `contact.html` — Contact form (posts to FormSubmit.co, an external service)
- `css/style.css` — All styles; uses Google Fonts CDN for Montserrat
- `img/` — Profile image

### Running the dev server
Serve the site with any static file server from the workspace root:
```
python3 -m http.server 8080
```
Then open `http://localhost:8080` in a browser.

### Lint / Test / Build
- There are no automated tests, linters, or build steps in this repository.
- To validate HTML, use an external validator or browser dev tools.

### Notes
- The contact form relies on the external service FormSubmit.co; it will not submit successfully without internet access, but the form UI itself is fully testable locally.
- Google Fonts are loaded from CDN; the site falls back to system sans-serif fonts without internet.
