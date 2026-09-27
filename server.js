const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
    res.send("Labubu Web backend is no longer required. The site now uses direct access.");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Labubu Web status server running on port ${PORT}`);
});
