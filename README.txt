LABUBU WEB v1.6.00 — CLOUD ACCOUNTS

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

V1.5 CHAT
- Global chat is stored by the same cloud backend.
- Logged-in accounts can read/send messages from any device.
- The last 1000 messages are retained in accounts.json.
- Owner messages display a yellow OWNER crown badge.

V1.6
- All 50 settings are connected to the settings engine and cloud profile.
- Volume settings are mutually exclusive.
- Reset restores original defaults.
- Owner username: TTNOWNER.
- Set OWNER_PASSWORD in Render to your chosen Owner password; never put it in index.html/GitHub.
