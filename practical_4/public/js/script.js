const form = document.getElementById("registrationForm");

if (form) {
    const nameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");

    const nameMessage = document.getElementById("nameMessage");
    const passwordMessage = document.getElementById("passwordMessage");
    const confirmMessage = document.getElementById("confirmMessage");
    const passwordStrength = document.getElementById("passwordStrength");
    const submitButton = document.getElementById("submitButton");

    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    });

    nameInput.addEventListener("input", () => {
        const name = nameInput.value.trim();

        if (name.length === 0) {
            nameMessage.textContent = "";
            nameInput.classList.remove("valid", "invalid");
            return;
        }

        if (name.length >= 3 && /^[A-Za-z\s.'-]+$/.test(name)) {
            nameMessage.textContent = "Name looks good.";
            nameInput.classList.add("valid");
            nameInput.classList.remove("invalid");
        } else {
            nameMessage.textContent = "Use at least 3 letters.";
            nameInput.classList.add("invalid");
            nameInput.classList.remove("valid");
        }
    });

    passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;

        let strength = 0;

        if (password.length >= 8) {
            strength++;
        }

        if (/[A-Za-z]/.test(password)) {
            strength++;
        }

        if (/\d/.test(password)) {
            strength++;
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            strength++;
        }

        passwordStrength.style.width = `${strength * 25}%`;

        if (password.length === 0) {
            passwordMessage.textContent =
                "Use at least 8 characters, including a letter and number.";
        } else if (strength <= 1) {
            passwordMessage.textContent = "Weak password.";
        } else if (strength === 2) {
            passwordMessage.textContent = "Moderate password.";
        } else {
            passwordMessage.textContent = "Strong password.";
        }

        checkPasswords();
    });

    confirmInput.addEventListener("input", checkPasswords);

    function checkPasswords() {
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (!confirmPassword) {
            confirmMessage.textContent = "";
            confirmInput.classList.remove("valid", "invalid");
            return;
        }

        if (password === confirmPassword) {
            confirmMessage.textContent = "Passwords match.";
            confirmInput.classList.add("valid");
            confirmInput.classList.remove("invalid");
        } else {
            confirmMessage.textContent = "Passwords do not match.";
            confirmInput.classList.add("invalid");
            confirmInput.classList.remove("valid");
        }
    }

    form.addEventListener("submit", (event) => {
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (password.length < 8 || password !== confirmPassword) {
            event.preventDefault();
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = "Validating... <span>→</span>";
    });
}