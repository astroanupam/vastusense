VASTUSENSE - PUBLISH THROUGH GITHUB (11 files)
==============================================
Files: index.html, app.css, data.js, i18n.js, map.js, app.js, sw.js,
       manifest.webmanifest, icon.svg, icon-maskable.svg, README.txt

1. On github.com create a new repository (e.g. "vastusense"), Public.
2. Click "Add file" > "Upload files". Drag in all 11 files (not a folder). Commit.
3. Repository > Settings > Pages > Source: "Deploy from a branch",
   Branch: main, Folder: / (root). Save.
4. After about a minute the site is live at:
   https://YOUR-NAME.github.io/vastusense/

Install as an app (same link, no store needed):
 - Desktop (Chrome / Edge): open the link, click the install icon in the address bar.
 - Android: open in Chrome > menu > "Install app" / "Add to Home screen".
 - iPhone/iPad: open in Safari > Share > "Add to Home Screen".
 After the first visit the app also works offline.

When you change any file: re-upload it to GitHub and raise VERSION in sw.js
(vastusense-1 -> vastusense-2) so installed copies update.

Note: maps and projects stay on the user's own device. Nothing is uploaded anywhere.
