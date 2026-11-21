# Krishna Vishwakarma — 3D Portfolio

Scroll through a brutalist 3D exhibition (Three.js). No build step, no npm.

## Structure
```
index.html        page shell
css/style.css     palette + panel styling
js/data.js        ✏️ ALL your content (edit this)
js/main.js        3D scene, camera path, scroll logic
assets/photo.jpg  your portrait
.nojekyll
```

## Edit
- Replace `YOUR_EMAIL@example.com` and the LinkedIn URL at the bottom of `js/data.js`.
- Add/remove projects by copying a `{type:'project', ...}` block.
- Swap the photo by replacing `assets/photo.jpg`.

## Run locally
`python3 -m http.server 8000` → open http://localhost:8000  (opening index.html directly will NOT work; ES modules need a server)

## Deploy free (GitHub Pages)
1. Create a repo, upload everything in this folder (keep the structure).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
3. Live at `https://<username>.github.io/<repo>/`
