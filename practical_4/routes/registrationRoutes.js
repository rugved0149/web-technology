const express = require("express");

const router = express.Router();

const events = {
    "tech-fest": "Tech Innovation Fest",
    "hackathon": "Campus Hackathon",
    "cyber-summit": "Cyber Security Summit",
    "code-arena": "Code Arena"
};

router.get("/", (req, res) => {
    res.redirect("/");
});

router.post("/", (req, res) => {
    const {
        fullName,
        email,
        phone,
        college,
        year,
        event,
        password,
        confirmPassword,
        terms
    } = req.body;

    const errors = [];

    const name = fullName ? fullName.trim() : "";
    const emailValue = email ? email.trim().toLowerCase() : "";
    const phoneValue = phone ? phone.trim() : "";
    const collegeValue = college ? college.trim() : "";

    if (name.length < 3 || !/^[A-Za-z\s.'-]+$/.test(name)) {
        errors.push("Enter a valid full name with at least 3 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        errors.push("Enter a valid email address.");
    }

    if (!/^[6-9]\d{9}$/.test(phoneValue)) {
        errors.push("Enter a valid 10-digit Indian mobile number.");
    }

    if (collegeValue.length < 3) {
        errors.push("College name must contain at least 3 characters.");
    }

    if (!["1", "2", "3", "4"].includes(year)) {
        errors.push("Select a valid academic year.");
    }

    if (!events[event]) {
        errors.push("Select a valid event.");
    }

    if (!password || password.length < 8) {
        errors.push("Password must contain at least 8 characters.");
    }

    if (password && !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        errors.push("Password must contain at least one letter and one number.");
    }

    if (password !== confirmPassword) {
        errors.push("Passwords do not match.");
    }

    if (terms !== "accepted") {
        errors.push("You must accept the terms and conditions.");
    }

    if (errors.length > 0) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Validation Failed | CampusPass</title>
                <link rel="stylesheet" href="/css/style.css">
            </head>
            <body>
                <nav class="navbar">
                    <a href="/" class="brand">
                        <span class="brand-mark">C</span>
                        <span>CampusPass</span>
                    </a>

                    <div class="nav-links">
                        <a href="/">Home</a>
                        <a href="/profile">Profile</a>
                    </div>
                </nav>

                <main class="result-page">
                    <div class="result-card error-card">
                        <div class="result-icon">!</div>

                        <span class="eyebrow">VALIDATION FAILED</span>
                        <h1>Check your details</h1>

                        <p class="result-description">
                            The Node.js server rejected the submitted data.
                        </p>

                        <div class="error-list">
                            ${errors.map(error => `<div>• ${error}</div>`).join("")}
                        </div>

                        <a href="/" class="button">Edit Registration</a>
                    </div>
                </main>
            </body>
            </html>
        `);
    }

    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Successful | CampusPass</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <nav class="navbar">
                <a href="/" class="brand">
                    <span class="brand-mark">C</span>
                    <span>CampusPass</span>
                </a>

                <div class="nav-links">
                    <a href="/">Home</a>
                    <a href="/profile">Profile</a>
                </div>
            </nav>

            <main class="result-page">
                <div class="result-card success-card">
                    <div class="result-icon">✓</div>

                    <span class="eyebrow">REGISTRATION CONFIRMED</span>

                    <h1>You're registered, ${escapeHtml(name)}.</h1>

                    <p class="result-description">
                        Your registration successfully passed server-side validation.
                    </p>

                    <div class="registration-summary">
                        <div>
                            <span>Event</span>
                            <strong>${events[event]}</strong>
                        </div>

                        <div>
                            <span>Email</span>
                            <strong>${escapeHtml(emailValue)}</strong>
                        </div>

                        <div>
                            <span>College</span>
                            <strong>${escapeHtml(collegeValue)}</strong>
                        </div>

                        <div>
                            <span>Academic Year</span>
                            <strong>Year ${year}</strong>
                        </div>
                    </div>

                    <div class="result-actions">
                        <a href="/" class="button">Register Another</a>
                        <a href="/profile" class="secondary-button">View Profile</a>
                    </div>
                </div>
            </main>
        </body>
        </html>
    `);
});

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = router;