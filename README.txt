LABUBU WEB v1.4.00 — CLOUD ACCOUNTS

FILES
- index.html -> GitHub Pages
- server.js + package.json -> your Render backend

RENDER ENVIRONMENT VARIABLES
JWT_SECRET = choose a long random secret
OWNER_PASSWORD = set your private Owner password
FRONTEND_ORIGIN = https://gokubrouytb987654321-blip.github.io
DATA_DIR = /var/data   (recommended when using a Render persistent disk)

IMPORTANT
The backend stores passwords as bcrypt hashes, never plaintext.
For accounts to survive backend redeploys/restarts, attach persistent storage and point DATA_DIR to it.
The frontend API URL is:
https://labubu-discord-backend.onrender.com

After deploying the backend, replace your GitHub Pages index.html with the included index.html.
