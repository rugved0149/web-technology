const express = require("express");
const path = require("path");

const registrationRoutes = require("./routes/registrationRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

const publicPath = path.join(__dirname, "public");
const viewsPath = path.join(__dirname, "views");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(publicPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(viewsPath, "index.html"));
});

app.get("/profile", (req, res) => {
    console.log("GET /profile");
    console.log("Profile path:", path.join(viewsPath, "profile.html"));

    res.sendFile(
        path.join(viewsPath, "profile.html"),
        (error) => {
            if (error) {
                console.error("Profile error:", error);
                res.status(500).send("Could not load profile.html");
            }
        }
    );
});

app.use("/register", registrationRoutes);

app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 | CampusPass</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <nav class="navbar">
                <a href="/" class="brand">
                    <span class="brand-mark">C</span>
                    <span>CampusPass</span>
                </a>
            </nav>

            <main class="result-page">
                <div class="result-card error-card">
                    <div class="result-icon">!</div>
                    <span class="eyebrow">ERROR 404</span>
                    <h1>Page not found</h1>
                    <p class="result-description">
                        The requested route does not exist.
                    </p>
                    <a href="/" class="button">Back to Home</a>
                </div>
            </main>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log(" CampusPass Server");
    console.log("=================================");
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` App: ${__dirname}`);
    console.log(` Views: ${viewsPath}`);
    console.log("=================================");
});