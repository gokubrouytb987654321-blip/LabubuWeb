```javascript
const express = require("express");

const app = express();

const PORT = process.env.PORT || 10000;

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

const REDIRECT_URI =
    process.env.DISCORD_REDIRECT_URI ||
    "https://labubu-discord-backend.onrender.com/callback";

const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "https://gokubrouytb987654321-blip.github.io/LabubuWeb/";


app.get("/", (req, res) => {

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Labubu Web API</title>
        </head>

        <body style="
            background:#080000;
            color:white;
            font-family:Arial;
            text-align:center;
            padding-top:100px;
        ">

            <h1>🔥 Labubu Web Backend</h1>

            <p>Backend Discord opérationnel.</p>

            <a
                href="/login"
                style="
                    display:inline-block;
                    color:white;
                    background:#5865F2;
                    padding:15px 25px;
                    border-radius:10px;
                    text-decoration:none;
                "
            >
                Connexion Discord
            </a>

        </body>
        </html>
    `);

});


app.get("/login", (req, res) => {

    if (!CLIENT_ID) {
        return res.status(500).send(
            "DISCORD_CLIENT_ID manquant."
        );
    }

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: "identify"
    });

    const discordURL =
        "https://discord.com/oauth2/authorize?" +
        params.toString();

    res.redirect(discordURL);

});


app.get("/callback", async (req, res) => {

    const code = req.query.code;

    if (!code) {
        return res.status(400).send(
            "Code Discord manquant."
        );
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).send(
            "Configuration Discord incomplète."
        );
    }

    try {

        const tokenResponse = await fetch(
            "https://discord.com/api/oauth2/token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            }
        );


        if (!tokenResponse.ok) {

            const error =
                await tokenResponse.text();

            console.error(
                "Discord token error:",
                error
            );

            return res.status(500).send(
                "Impossible de terminer la connexion Discord."
            );
        }


        const tokenData =
            await tokenResponse.json();


        const userResponse = await fetch(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    Authorization:
                        `Bearer ${tokenData.access_token}`
                }
            }
        );


        if (!userResponse.ok) {

            const error =
                await userResponse.text();

            console.error(
                "Discord user error:",
                error
            );

            return res.status(500).send(
                "Impossible de récupérer le profil Discord."
            );
        }


        const user =
            await userResponse.json();


        const avatar =
            user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
                : null;


        const safeUser = {
            id: user.id,
            username: user.username,
            global_name: user.global_name,
            avatar: avatar
        };


        const encoded =
            encodeURIComponent(
                JSON.stringify(safeUser)
            );


        res.redirect(
            `${FRONTEND_URL}?discord_user=${encoded}`
        );

    }

    catch (error) {

        console.error(
            "Server error:",
            error
        );

        res.status(500).send(
            "Erreur serveur."
        );

    }

});


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Labubu Backend lancé sur le port ${PORT}`
        );

    }
);
```
