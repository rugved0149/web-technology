let events = JSON.parse(
    localStorage.getItem("eventVaultData")
) || [];

let currentFilter = "all";
let editingId = null;

const eventForm = document.getElementById("eventForm");
const eventModalElement = document.getElementById("eventModal");
const eventModal = new bootstrap.Modal(eventModalElement);

const eventTitle = document.getElementById("eventTitle");
const eventType = document.getElementById("eventType");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventLocation = document.getElementById("eventLocation");
const eventDescription =
    document.getElementById("eventDescription");

const today = new Date().toISOString().split("T")[0];

eventDate.min = today;


function saveEvents() {
    const jsonData = JSON.stringify(events);

    localStorage.setItem(
        "eventVaultData",
        jsonData
    );
}


function renderEvents() {

    const searchText =
        document.getElementById("eventSearch")
            .value
            .trim()
            .toLowerCase();

    const statusFilter =
        document.getElementById("statusFilter").value;

    const priorityFilter =
        document.getElementById("priorityFilter").value;

    const filteredEvents = events.filter(event => {

        const matchesCategory =
            currentFilter === "all" ||
            event.type === currentFilter;

        const matchesSearch =
            event.title.toLowerCase().includes(searchText) ||
            event.location.toLowerCase().includes(searchText) ||
            event.type.toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "completed" && event.completed) ||
            (statusFilter === "upcoming" && !event.completed);

        const matchesPriority =
            priorityFilter === "all" ||
            event.priority === priorityFilter;

        return (
            matchesCategory &&
            matchesSearch &&
            matchesStatus &&
            matchesPriority
        );
    });


    filteredEvents.sort((a, b) => {

        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        return new Date(`${a.date}T${a.time}`) -
               new Date(`${b.date}T${b.time}`);
    });


    const container =
        document.getElementById("eventContainer");

    container.innerHTML = "";


    filteredEvents.forEach(event => {

        container.innerHTML +=
            createEventCard(event);

    });


    document.getElementById("emptyEvents")
        .style.display =
        filteredEvents.length === 0
            ? "block"
            : "none";


    updateDashboard();
    updateInsights();
    updateNextEvent();
}


function createEventCard(event) {

    const priorityClass =
        `priority-${event.priority.toLowerCase()}`;

    const completedClass =
        event.completed ? "completed" : "";

    return `
        <div class="col-md-6 col-lg-4">

            <div class="event-card ${completedClass}">

                <div class="event-card-top">

                    <span class="event-type">
                        ${event.type}
                    </span>

                    <span class="priority ${priorityClass}">
                        ${event.priority}
                    </span>

                </div>


                <h3>
                    ${event.title}
                </h3>


                <p class="event-card-description">
                    ${event.description ||
                    "No description provided."}
                </p>


                <div class="event-details">

                    <div>
                        <i class="bi bi-calendar3"></i>
                        ${formatDate(event.date)}
                    </div>

                    <div>
                        <i class="bi bi-clock"></i>
                        ${formatTime(event.time)}
                    </div>

                    <div>
                        <i class="bi bi-geo-alt"></i>
                        ${event.location}
                    </div>

                </div>


                ${
                    event.completed
                    ? `
                        <span class="completed-label">
                            <i class="bi bi-check-circle-fill"></i>
                            Completed
                        </span>
                    `
                    : ""
                }


                <div class="event-actions">

                    <button class="complete-btn"
                            onclick="toggleComplete(${event.id})">

                        <i class="bi ${
                            event.completed
                            ? "bi-arrow-counterclockwise"
                            : "bi-check-lg"
                        }"></i>

                        ${
                            event.completed
                            ? "Undo"
                            : "Done"
                        }

                    </button>


                    <button class="edit-btn"
                            onclick="editEvent(${event.id})">

                        <i class="bi bi-pencil"></i>
                        Edit

                    </button>


                    <button class="delete-btn"
                            onclick="deleteEvent(${event.id})">

                        <i class="bi bi-trash"></i>
                        Delete

                    </button>

                </div>

            </div>

        </div>
    `;
}


function validateForm() {

    clearErrors();

    let valid = true;

    const title =
        eventTitle.value.trim();

    const location =
        eventLocation.value.trim();


    if (!title) {

        showError(
            "eventTitle",
            "Event title is required."
        );

        valid = false;

    } else if (title.length < 3) {

        showError(
            "eventTitle",
            "Title must contain at least 3 characters."
        );

        valid = false;

    } else if (title.length > 60) {

        showError(
            "eventTitle",
            "Title cannot exceed 60 characters."
        );

        valid = false;
    }


    if (!eventType.value) {

        showError(
            "eventType",
            "Please select an event type."
        );

        valid = false;
    }


    if (!eventDate.value) {

        showError(
            "eventDate",
            "Please select an event date."
        );

        valid = false;

    } else if (eventDate.value < today) {

        showError(
            "eventDate",
            "Event date cannot be in the past."
        );

        valid = false;
    }


    if (!eventTime.value) {

        showError(
            "eventTime",
            "Please select an event time."
        );

        valid = false;
    }


    if (!location) {

        showError(
            "eventLocation",
            "Location is required."
        );

        valid = false;

    } else if (location.length < 3) {

        showError(
            "eventLocation",
            "Location must contain at least 3 characters."
        );

        valid = false;
    }


    const duplicate = events.some(event => {

        if (editingId && event.id === editingId) {
            return false;
        }

        return (
            event.title.toLowerCase() ===
            title.toLowerCase() &&
            event.date === eventDate.value &&
            event.time === eventTime.value
        );
    });


    if (duplicate) {

        showError(
            "eventTitle",
            "An event with the same title, date and time already exists."
        );

        valid = false;
    }


    const formError =
        document.getElementById("formError");


    if (!valid) {

        formError.style.display = "flex";

        formError.querySelector("span")
            .textContent =
            "Please correct the highlighted fields before saving.";
    }


    return valid;
}


function showError(field, message) {

    const input =
        document.getElementById(field);

    const error =
        document.getElementById(field + "Error");


    if (input) {
        input.classList.add("input-error");
    }


    if (error) {
        error.textContent = message;
    }
}


function clearErrors() {

    document.querySelectorAll(".error-message")
        .forEach(error => {
            error.textContent = "";
        });


    document.querySelectorAll(
        ".form-control, .form-select"
    ).forEach(input => {
        input.classList.remove("input-error");
    });


    document.getElementById("formError")
        .style.display = "none";
}


eventForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        if (!validateForm()) {
            return;
        }


        const priority =
            document.querySelector(
                'input[name="priority"]:checked'
            ).value;


        const newEvent = {

            id: editingId || Date.now(),

            title: eventTitle.value.trim(),

            type: eventType.value,

            date: eventDate.value,

            time: eventTime.value,

            location: eventLocation.value.trim(),

            description:
                eventDescription.value.trim(),

            priority: priority,

            completed: editingId
                ? getExistingEvent(editingId).completed
                : false
        };


        if (editingId) {

            events = events.map(event =>
                event.id === editingId
                    ? newEvent
                    : event
            );

            showToast(
                "Event updated successfully."
            );

        } else {

            events.push(newEvent);

            showToast(
                "Event added successfully."
            );
        }


        saveEvents();

        renderEvents();

        resetForm();

        eventModal.hide();
    }
);


function getExistingEvent(id) {

    return events.find(
        event => event.id === id
    );
}


function openEventForm() {

    resetForm();

    document.getElementById("modalEyebrow")
        .textContent = "NEW EVENT";

    document.getElementById("modalTitle")
        .textContent = "Create an event";

    document.getElementById("submitButton")
        .innerHTML =
        '<i class="bi bi-check2-circle"></i> Save Event';

    eventModal.show();
}


function editEvent(id) {

    const event =
        getExistingEvent(id);


    if (!event) {
        return;
    }


    editingId = id;

    eventTitle.value = event.title;
    eventType.value = event.type;
    eventDate.value = event.date;
    eventTime.value = event.time;
    eventLocation.value = event.location;
    eventDescription.value =
        event.description;


    const priority =
        document.querySelector(
            `input[name="priority"][value="${event.priority}"]`
        );


    if (priority) {
        priority.checked = true;
    }


    document.getElementById("modalEyebrow")
        .textContent = "EDIT EVENT";

    document.getElementById("modalTitle")
        .textContent = "Update your event";

    document.getElementById("submitButton")
        .innerHTML =
        '<i class="bi bi-arrow-repeat"></i> Update Event';


    updateCharacterCount();

    clearErrors();

    eventModal.show();
}


function deleteEvent(id) {

    const event =
        getExistingEvent(id);


    if (!event) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${event.title}"?`
        );


    if (!confirmed) {
        return;
    }


    events = events.filter(
        event => event.id !== id
    );


    saveEvents();

    renderEvents();

    showToast(
        "Event deleted."
    );
}


function toggleComplete(id) {

    const event =
        getExistingEvent(id);


    if (!event) {
        return;
    }


    event.completed =
        !event.completed;


    saveEvents();

    renderEvents();


    showToast(
        event.completed
            ? "Event marked as completed."
            : "Event moved back to upcoming."
    );
}


function filterEvents(filter, button) {

    currentFilter = filter;


    document.querySelectorAll(".filter-btn")
        .forEach(btn =>
            btn.classList.remove("active")
        );


    button.classList.add("active");

    renderEvents();
}


function updateDashboard() {

    const now = new Date();


    const upcoming =
        events.filter(event =>
            !event.completed &&
            new Date(`${event.date}T${event.time}`) >= now
        );


    const highPriority =
        events.filter(
            event => event.priority === "High"
        );


    const completed =
        events.filter(
            event => event.completed
        );


    document.getElementById("totalEvents")
        .textContent = events.length;


    document.getElementById("upcomingEvents")
        .textContent = upcoming.length;


    document.getElementById("priorityEvents")
        .textContent = highPriority.length;


    document.getElementById("completedEvents")
        .textContent = completed.length;
}


function updateNextEvent() {

    const now = new Date();


    const upcoming =
        events
            .filter(event =>
                !event.completed &&
                new Date(`${event.date}T${event.time}`) >= now
            )
            .sort((a, b) =>
                new Date(`${a.date}T${a.time}`) -
                new Date(`${b.date}T${b.time}`)
            );


    if (upcoming.length === 0) {

        document.getElementById("nextEventTitle")
            .textContent =
            "Your schedule is clear";

        document.getElementById("nextEventDate")
            .textContent =
            "Add an event";

        document.getElementById("nextEventTime")
            .textContent = "--";

        document.getElementById("nextEventLocation")
            .textContent = "--";

        document.getElementById("countdown")
            .textContent =
            "No upcoming event";

        return;
    }


    const next = upcoming[0];


    document.getElementById("nextEventTitle")
        .textContent = next.title;


    document.getElementById("nextEventDate")
        .textContent =
        formatDate(next.date);


    document.getElementById("nextEventTime")
        .textContent =
        formatTime(next.time);


    document.getElementById("nextEventLocation")
        .textContent =
        next.location;


    updateCountdown(next);
}


function updateCountdown(event) {

    const target =
        new Date(`${event.date}T${event.time}`);

    const now = new Date();

    const difference =
        target - now;


    if (difference <= 0) {

        document.getElementById("countdown")
            .textContent = "Starting now";

        return;
    }


    const days =
        Math.floor(
            difference / (1000 * 60 * 60 * 24)
        );


    const hours =
        Math.floor(
            (difference / (1000 * 60 * 60)) % 24
        );


    const minutes =
        Math.floor(
            (difference / (1000 * 60)) % 60
        );


    if (days > 0) {

        document.getElementById("countdown")
            .textContent =
            `${days}d ${hours}h ${minutes}m`;

    } else {

        document.getElementById("countdown")
            .textContent =
            `${hours}h ${minutes}m`;
    }
}


function updateInsights() {

    const completed =
        events.filter(
            event => event.completed
        ).length;


    const total =
        events.length;


    const completion =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    document.getElementById("completionRate")
        .textContent =
        `${completion}%`;


    document.getElementById("completionBar")
        .style.width =
        `${completion}%`;


    if (events.length === 0) {

        document.getElementById("topCategory")
            .textContent = "No data";

        document.getElementById("busiestDay")
            .textContent = "No data";

        return;
    }


    const categoryCount = {};


    events.forEach(event => {

        categoryCount[event.type] =
            (categoryCount[event.type] || 0) + 1;
    });


    const topCategory =
        Object.keys(categoryCount)
            .sort(
                (a, b) =>
                    categoryCount[b] -
                    categoryCount[a]
            )[0];


    document.getElementById("topCategory")
        .textContent =
        topCategory;


    const dayCount = {};


    events.forEach(event => {

        const day =
            new Date(
                event.date + "T00:00:00"
            ).toLocaleDateString(
                "en-IN",
                { weekday: "long" }
            );


        dayCount[day] =
            (dayCount[day] || 0) + 1;
    });


    const busiest =
        Object.keys(dayCount)
            .sort(
                (a, b) =>
                    dayCount[b] -
                    dayCount[a]
            )[0];


    document.getElementById("busiestDay")
        .textContent =
        busiest;
}


function formatDate(date) {

    return new Date(
        date + "T00:00:00"
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatTime(time) {

    const [hours, minutes] =
        time.split(":");


    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function updateCharacterCount() {

    document.getElementById("characterCount")
        .textContent =
        eventDescription.value.length;
}


eventDescription.addEventListener(
    "input",
    updateCharacterCount
);


function resetForm() {

    eventForm.reset();

    editingId = null;

    eventDate.min = today;

    clearErrors();

    updateCharacterCount();


    document.querySelector(
        'input[name="priority"][value="Medium"]'
    ).checked = true;


    document.getElementById("modalEyebrow")
        .textContent = "NEW EVENT";

    document.getElementById("modalTitle")
        .textContent = "Create an event";

    document.getElementById("submitButton")
        .innerHTML =
        '<i class="bi bi-check2-circle"></i> Save Event';
}


eventModalElement.addEventListener(
    "hidden.bs.modal",
    resetForm
);


function showToast(message) {

    document.getElementById("toastMessage")
        .textContent = message;


    const toast =
        new bootstrap.Toast(
            document.getElementById("appToast"),
            {
                delay: 2500
            }
        );


    toast.show();
}


function exportEvents() {

    if (events.length === 0) {

        showToast(
            "There are no events to export."
        );

        return;
    }


    const jsonData =
        JSON.stringify(
            events,
            null,
            4
        );


    const blob =
        new Blob(
            [jsonData],
            {
                type: "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "eventvault-data.json";

    link.click();


    URL.revokeObjectURL(url);


    showToast(
        "Events exported as JSON."
    );
}


function importEvents(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload = function(e) {

        try {

            const imported =
                JSON.parse(e.target.result);


            if (!Array.isArray(imported)) {

                throw new Error(
                    "Imported data is not an array."
                );
            }


            const validData =
                imported.every(item =>
                    item.title &&
                    item.type &&
                    item.date &&
                    item.time &&
                    item.location
                );


            if (!validData) {

                throw new Error(
                    "Some event records are incomplete."
                );
            }


            events = imported;


            saveEvents();

            renderEvents();


            showToast(
                "JSON data imported successfully."
            );

        } catch (error) {

            showToast(
                "Invalid JSON file."
            );
        }


        event.target.value = "";
    };


    reader.readAsText(file);
}


function clearAllEvents() {

    if (events.length === 0) {

        showToast(
            "There are no events to clear."
        );

        return;
    }


    const confirmed =
        confirm(
            "Delete all saved events? This cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    events = [];

    saveEvents();

    renderEvents();


    showToast(
        "All events have been removed."
    );
}


const themeToggle =
    document.getElementById("themeToggle");


const savedTheme =
    localStorage.getItem(
        "eventVaultTheme"
    );


if (savedTheme) {

    document.documentElement
        .setAttribute(
            "data-theme",
            savedTheme
        );

    updateThemeIcon();
}


themeToggle.addEventListener(
    "click",
    function() {

        const current =
            document.documentElement
                .getAttribute(
                    "data-theme"
                );


        const newTheme =
            current === "dark"
                ? "light"
                : "dark";


        document.documentElement
            .setAttribute(
                "data-theme",
                newTheme
            );


        localStorage.setItem(
            "eventVaultTheme",
            newTheme
        );


        updateThemeIcon();

        showToast(
            newTheme === "dark"
                ? "Dark mode enabled."
                : "Light mode enabled."
        );
    }
);


function updateThemeIcon() {

    const dark =
        document.documentElement
            .getAttribute(
                "data-theme"
            ) === "dark";


    themeToggle.innerHTML =
        `<i class="bi ${
            dark ? "bi-sun" : "bi-moon"
        }"></i>`;
}


document.querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            function() {

                document.querySelectorAll(
                    ".nav-link"
                ).forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );

                link.classList.add(
                    "active"
                );
            }
        );
    });


setInterval(
    updateNextEvent,
    30000
);


renderEvents();

updateCharacterCount();     