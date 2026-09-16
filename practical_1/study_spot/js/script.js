const spaces = [
    {
        id: 1,
        name: "Silent Zone",
        category: "quiet",
        label: "Quiet",
        icon: "bi-volume-mute",
        color: "purple",
        capacity: 18,
        occupied: 11,
        facilities: ["Wi-Fi", "Charging", "Silent"],
        description: "Distraction-free desks designed for deep focus, reading and individual work."
    },
    {
        id: 2,
        name: "Collab Room",
        category: "collab",
        label: "Popular",
        icon: "bi-people",
        color: "green",
        capacity: 8,
        occupied: 5,
        facilities: ["Whiteboard", "Wi-Fi", "Projector"],
        description: "Spacious rooms designed for group projects, discussions and presentations."
    },
    {
        id: 3,
        name: "Open Air",
        category: "outdoor",
        label: "Outdoor",
        icon: "bi-tree",
        color: "orange",
        capacity: 12,
        occupied: 4,
        facilities: ["Charging", "Fresh Air", "Wi-Fi"],
        description: "Relaxed outdoor seating for lighter study sessions and brainstorming."
    },
    {
        id: 4,
        name: "Innovation Hub",
        category: "collab",
        label: "Creative",
        icon: "bi-lightbulb",
        color: "blue",
        capacity: 16,
        occupied: 9,
        facilities: ["Projector", "Wi-Fi", "Whiteboard"],
        description: "A flexible workspace for coding, presentations and creative projects."
    },
    {
        id: 5,
        name: "Research Room",
        category: "quiet",
        label: "Focused",
        icon: "bi-journal-bookmark",
        color: "red",
        capacity: 10,
        occupied: 3,
        facilities: ["Wi-Fi", "Power", "Reference Books"],
        description: "A calm environment for research, assignments and long study sessions."
    },
    {
        id: 6,
        name: "Garden Corner",
        category: "outdoor",
        label: "Relaxed",
        icon: "bi-flower1",
        color: "green",
        capacity: 14,
        occupied: 6,
        facilities: ["Wi-Fi", "Outdoor", "Charging"],
        description: "A peaceful garden-side area for reading and relaxed study sessions."
    }
];

let currentCategory = "all";
let favorites = JSON.parse(localStorage.getItem("studySpotFavorites")) || [];
let reservations = JSON.parse(localStorage.getItem("studySpotReservations")) || [];

const bookingForm = document.getElementById("bookingForm");
const bookingSuccess = document.getElementById("bookingSuccess");
const bookingModal = document.getElementById("bookingModal");
const detailsModal = document.getElementById("detailsModal");
const bookingDate = document.getElementById("bookingDate");
const spaceSelect = document.getElementById("spaceSelect");

const today = new Date().toISOString().split("T")[0];
bookingDate.min = today;


function renderSpaces() {
    const container = document.getElementById("spaceContainer");
    const search = document.getElementById("spaceSearch").value.toLowerCase();

    const filtered = spaces.filter(space => {
        const matchesCategory =
            currentCategory === "all" || space.category === currentCategory;

        const matchesSearch =
            space.name.toLowerCase().includes(search) ||
            space.facilities.join(" ").toLowerCase().includes(search);

        return matchesCategory && matchesSearch;
    });

    container.innerHTML = "";

    filtered.forEach(space => {
        const available = space.capacity - space.occupied;
        const percentage = Math.round((space.occupied / space.capacity) * 100);
        const isFavorite = favorites.includes(space.id);

        container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="space-card">

                    <div class="space-icon ${space.color}">
                        <i class="bi ${space.icon}"></i>
                    </div>

                    <span class="badge rounded-pill text-bg-light">
                        ${space.label}
                    </span>

                    <button class="favorite-btn ${isFavorite ? "active" : ""}"
                            onclick="toggleFavorite(${space.id})"
                            title="Favorite">
                        <i class="bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}"></i>
                    </button>

                    <h3>${space.name}</h3>

                    <p>${space.description}</p>

                    <div class="space-meta">
                        <span>
                            <i class="bi bi-people"></i>
                            ${space.capacity} seats
                        </span>

                        ${space.facilities.slice(0, 2).map(facility =>
                            `<span><i class="bi bi-check2"></i>${facility}</span>`
                        ).join("")}
                    </div>

                    <div class="availability-mini">
                        <div class="availability-mini-top">
                            <span>${available} seats available</span>
                            <strong>${percentage}% occupied</strong>
                        </div>

                        <div class="mini-progress">
                            <div style="width:${percentage}%"></div>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-details"
                                onclick="showDetails(${space.id})">
                            Details
                        </button>

                        <button class="btn btn-space"
                                onclick="openBooking('${space.name}')">
                            Reserve
                        </button>
                    </div>

                </div>
            </div>
        `;
    });

    document.getElementById("noSpaces")
        .classList.toggle("d-none", filtered.length !== 0);
}


function filterSpaces() {
    renderSpaces();
}


function filterCategory(category, button) {
    currentCategory = category;

    document.querySelectorAll(".filter-btn")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    renderSpaces();
}


function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
        showToast("Removed from favorites.");
    } else {
        favorites.push(id);
        showToast("Added to favorites.");
    }

    localStorage.setItem(
        "studySpotFavorites",
        JSON.stringify(favorites)
    );

    renderSpaces();
    updateStats();
}


function showDetails(id) {
    const space = spaces.find(item => item.id === id);

    const available = space.capacity - space.occupied;
    const percentage = Math.round(
        (space.occupied / space.capacity) * 100
    );

    document.getElementById("detailsTitle").textContent = space.name;

    document.getElementById("detailsContent").innerHTML = `
        <div class="detail-icon">
            <i class="bi ${space.icon}"></i>
        </div>

        <p>${space.description}</p>

        <div class="row g-3 mt-2">

            <div class="col-4">
                <div class="detail-stat">
                    <strong>${space.capacity}</strong>
                    <span>Capacity</span>
                </div>
            </div>

            <div class="col-4">
                <div class="detail-stat">
                    <strong>${available}</strong>
                    <span>Available</span>
                </div>
            </div>

            <div class="col-4">
                <div class="detail-stat">
                    <strong>${percentage}%</strong>
                    <span>Occupied</span>
                </div>
            </div>

        </div>

        <h6 class="mt-4 mb-3">Facilities</h6>

        <div class="d-flex flex-wrap gap-2">
            ${space.facilities.map(facility =>
                `<span class="badge text-bg-light p-2">${facility}</span>`
            ).join("")}
        </div>
    `;

    document.getElementById("detailsReserveBtn").onclick = () => {
        bootstrap.Modal.getInstance(detailsModal).hide();

        setTimeout(() => {
            openBooking(space.name);
        }, 300);
    };

    new bootstrap.Modal(detailsModal).show();
}


function openBooking(spaceName = "") {
    const modal = new bootstrap.Modal(bookingModal);

    populateSpaceSelect();

    if (spaceName) {
        spaceSelect.value = spaceName;
    }

    modal.show();
    updateBookingPreview();
}


function populateSpaceSelect() {
    spaceSelect.innerHTML = `
        <option value="">Select a space</option>
        ${spaces.map(space =>
            `<option value="${space.name}">${space.name}</option>`
        ).join("")}
    `;
}


bookingForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const space = spaceSelect.value;
    const date = bookingDate.value;
    const duration = document.getElementById("duration").value;

    const reservation = {
        id: Date.now(),
        name,
        space,
        date,
        duration: Number(duration)
    };

    reservations.push(reservation);

    localStorage.setItem(
        "studySpotReservations",
        JSON.stringify(reservations)
    );

    bookingForm.classList.add("d-none");
    bookingSuccess.classList.remove("d-none");

    document.getElementById("successText").textContent =
        `${space} has been reserved for ${date}.`;

    renderReservations();
    updateStats();

    showToast("Reservation confirmed.");
});


function renderReservations() {
    const container = document.getElementById("reservationContainer");

    if (reservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar2-x"></i>
                <h3>No reservations yet</h3>
                <p>Your upcoming study sessions will appear here.</p>

                <button class="btn btn-primary-custom"
                        data-bs-toggle="modal"
                        data-bs-target="#bookingModal">
                    Make a Reservation
                </button>
            </div>
        `;

        return;
    }

    container.innerHTML = reservations
        .slice()
        .reverse()
        .map(reservation => `
            <div class="reservation-card">

                <div class="reservation-card-top">
                    <h3>${reservation.space}</h3>

                    <button class="cancel-btn"
                            onclick="cancelReservation(${reservation.id})">
                        Cancel
                    </button>
                </div>

                <div class="date">
                    <i class="bi bi-calendar3"></i>
                    ${formatDate(reservation.date)}
                </div>

                <p>
                    <i class="bi bi-person"></i>
                    ${reservation.name}
                    <br>
                    <i class="bi bi-clock"></i>
                    ${reservation.duration} hour${reservation.duration > 1 ? "s" : ""}
                </p>

            </div>
        `)
        .join("");
}


function cancelReservation(id) {
    reservations = reservations.filter(
        reservation => reservation.id !== id
    );

    localStorage.setItem(
        "studySpotReservations",
        JSON.stringify(reservations)
    );

    renderReservations();
    updateStats();

    showToast("Reservation cancelled.");
}


function updateStats() {
    const totalHours = reservations.reduce(
        (total, reservation) => total + reservation.duration,
        0
    );

    document.getElementById("reservationCount").textContent =
        reservations.length;

    document.getElementById("studyHours").textContent =
        totalHours;

    document.getElementById("favoriteCount").textContent =
        favorites.length;
}


function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function updateBookingPreview() {
    const preview = document.getElementById("bookingPreview");

    const space = spaceSelect.value;
    const date = bookingDate.value;
    const duration = document.getElementById("duration").value;

    if (!space || !date || !duration) {
        preview.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Select your details to see a summary.
        `;
        return;
    }

    preview.innerHTML = `
        <i class="bi bi-calendar-check"></i>
        You are reserving <strong>${space}</strong>
        on <strong>${formatDate(date)}</strong>
        for <strong>${duration} hour${duration > 1 ? "s" : ""}</strong>.
    `;
}


spaceSelect.addEventListener("change", updateBookingPreview);
bookingDate.addEventListener("change", updateBookingPreview);
document.getElementById("duration")
    .addEventListener("change", updateBookingPreview);


bookingModal.addEventListener("hidden.bs.modal", () => {
    bookingForm.reset();
    bookingForm.classList.remove("d-none");
    bookingSuccess.classList.add("d-none");
    updateBookingPreview();
});


function searchFromHero() {
    const value = document.getElementById("heroSearch").value;

    document.getElementById("spaceSearch").value = value;

    document.getElementById("spaces").scrollIntoView({
        behavior: "smooth"
    });

    renderSpaces();
}


document.getElementById("heroSearch")
    .addEventListener("keypress", event => {
        if (event.key === "Enter") {
            searchFromHero();
        }
    });


function updateClock() {
    const now = new Date();

    document.getElementById("liveClock").textContent =
        now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
}


setInterval(updateClock, 1000);
updateClock();


function updateLibraryAvailability() {
    const library = spaces.find(
        space => space.name === "Central Library"
    );

    const variation = Math.floor(Math.random() * 5) - 2;

    library.occupied = Math.max(
        1,
        Math.min(
            library.capacity,
            library.occupied + variation
        )
    );

    const percentage = Math.round(
        (library.occupied / library.capacity) * 100
    );

    document.getElementById("libraryOccupancy")
        .textContent = percentage + "%";

    document.getElementById("libraryProgress")
        .style.width = percentage + "%";

    document.getElementById("librarySeats")
        .textContent = `${library.occupied} seats occupied`;

    const currentHour = new Date().getHours();

    const isOpen = currentHour >= 7 && currentHour < 22;

    document.getElementById("libraryStatus")
        .textContent = isOpen ? "Open" : "Closed";
}


setInterval(updateLibraryAvailability, 5000);
updateLibraryAvailability();


function showToast(message) {
    document.getElementById("toastMessage").textContent = message;

    const toast = new bootstrap.Toast(
        document.getElementById("appToast"),
        {
            delay: 2500
        }
    );

    toast.show();
}


const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("studySpotTheme");

if (savedTheme) {
    document.documentElement.setAttribute(
        "data-theme",
        savedTheme
    );

    updateThemeIcon();
}


themeToggle.addEventListener("click", () => {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");

    const newTheme =
        currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute(
        "data-theme",
        newTheme
    );

    localStorage.setItem(
        "studySpotTheme",
        newTheme
    );

    updateThemeIcon();

    showToast(
        newTheme === "dark"
            ? "Dark mode enabled."
            : "Light mode enabled."
    );
});


function updateThemeIcon() {
    const dark =
        document.documentElement.getAttribute("data-theme") === "dark";

    themeToggle.innerHTML =
        `<i class="bi ${dark ? "bi-sun" : "bi-moon"}"></i>`;
}


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link")
            .forEach(item => item.classList.remove("active"));

        link.classList.add("active");
    });
});


renderSpaces();
renderReservations();
updateStats();
populateSpaceSelect();