const matchesContainer = document.getElementById("matchesContainer");
const matchesMessage = document.getElementById("matchesMessage");
const skillSearch = document.getElementById("skillSearch");
const matchFilter = document.getElementById("matchFilter");

let users = [];
let myProfile = null;

// Load the logged-in user's profile and all other registered users
async function loadMatches() {
matchesMessage.textContent = "Loading matches...";
matchesContainer.innerHTML = "";


try {
    const [profileResponse, usersResponse] = await Promise.all([
        fetch("http://127.0.0.1:3000/api/auth/me", {
            credentials: "include"
        }),
        fetch("http://127.0.0.1:3000/api/users", {
            credentials: "include"
        })
    ]);

    if (profileResponse.status === 401 || usersResponse.status === 401) {
        matchesMessage.textContent = "Please log in to find skill matches.";
        return;
    }

    if (!profileResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to load profiles from the server.");
    }

    const profileData = await profileResponse.json();
    const usersData = await usersResponse.json();

    myProfile = profileData.user || profileData;
    users = usersData.users || [];

    if (!myProfile.teaches || !myProfile.learns) {
        throw new Error("Your skills could not be loaded. Please update your skills.");
    }

    displayMatches();

} catch (error) {
    console.error("Error loading matches:", error);
    matchesMessage.textContent =
        "Could not load matches. Check that the backend is running and try again.";
}


}

function displayMatches() {
matchesContainer.innerHTML = "";


if (!myProfile) {
    matchesMessage.textContent = "Please log in to find skill matches.";
    return;
}

const searchTerm = skillSearch.value.trim().toLowerCase();
const filterType = matchFilter.value;

let matchCount = 0;

users.forEach(function (user) {
    const teaches = user.teaches || [];
    const learns = user.learns || [];

    // Skills I can teach that this user wants to learn
    const iCanTeach = myProfile.teaches.filter(function (skill) {
        return learns.some(
            s => s.toLowerCase() === skill.toLowerCase()
        );
    });

    // Skills I want to learn that this user can teach
    const iCanLearn = myProfile.learns.filter(function (skill) {
        return teaches.some(
            s => s.toLowerCase() === skill.toLowerCase()
        );
    });

    // Show only users with at least one compatible skill
    if (iCanTeach.length === 0 && iCanLearn.length === 0) {
        return;
    }

    if (filterType === "teach" && iCanTeach.length === 0) {
        return;
    }

    if (filterType === "learn" && iCanLearn.length === 0) {
        return;
    }

    // Search by name or skill
    const searchableText = [
        user.name || "",
        ...teaches,
        ...learns
    ].join(" ").toLowerCase();

    if (!searchableText.includes(searchTerm)) {
        return;
    }

    const card = document.createElement("div");
    card.className = "match-card";

    // Build the card safely without inserting user data as HTML
    const name = document.createElement("h3");
    name.textContent = user.name || "SkillSwap Member";

    const teachText = document.createElement("p");
    teachText.innerHTML = "<strong>Can teach:</strong> ";
    teachText.appendChild(
        document.createTextNode(teaches.join(", ") || "Not specified")
    );

    const learnText = document.createElement("p");
    learnText.innerHTML = "<strong>Wants to learn:</strong> ";
    learnText.appendChild(
        document.createTextNode(learns.join(", ") || "Not specified")
    );

    const canTeachText = document.createElement("p");
    canTeachText.innerHTML = "<strong>Skills you can teach them:</strong> ";
    canTeachText.appendChild(
        document.createTextNode(iCanTeach.join(", ") || "None")
    );

    const canLearnText = document.createElement("p");
    canLearnText.innerHTML = "<strong>Skills you can learn:</strong> ";
    canLearnText.appendChild(
        document.createTextNode(iCanLearn.join(", ") || "None")
    );

    const connectButton = document.createElement("button");
    connectButton.className = "btnprimary connect-button";
    connectButton.type = "button";
    connectButton.textContent = "Connect";

    connectButton.addEventListener("click", function () {
        if (typeof sendConnectionRequest === "function") {
            sendConnectionRequest(user.id);
        } else {
            matchesMessage.textContent =
                "Connection feature is unavailable. Check connections.js.";
        }
    });

    const profileLink = document.createElement("a");
    profileLink.href = `user-profile.html?id=${encodeURIComponent(user.id)}`;
    profileLink.textContent = "View Profile";
    profileLink.className = "profile-link";

    card.append(
        name,
        teachText,
        learnText,
        canTeachText,
        canLearnText,
        connectButton,
        profileLink
    );

    matchesContainer.appendChild(card);
    matchCount++;
});

if (matchCount === 0) {
    matchesMessage.textContent =
        users.length === 0
            ? "No other registered users found yet."
            : "No compatible users found. Try another search or update your skills.";
} else {
    matchesMessage.textContent = `Found ${matchCount} compatible user(s).`;
}


}

if (matchesContainer && skillSearch && matchFilter && matchesMessage) {
skillSearch.addEventListener("input", displayMatches);
matchFilter.addEventListener("change", displayMatches);


loadMatches();


} else {
console.error("Check that matches.html contains all required element IDs.");
}
