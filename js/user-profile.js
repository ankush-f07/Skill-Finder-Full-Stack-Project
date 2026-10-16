const userProfileContainer = document.getElementById("userProfile");

const params = new URLSearchParams(window.location.search);
const profileId = params.get("id");

async function loadUserProfile() {
userProfileContainer.textContent = "Loading profile...";


try {
    // Get the logged-in user's profile from the backend
    const response = await fetch(
        "http://127.0.0.1:3000/api/auth/me",
        {
            credentials: "include"
        }
    );

    if (response.status === 401) {
        userProfileContainer.textContent =
            "Please log in to view your profile.";
        return;
    }

    if (!response.ok) {
        throw new Error("Failed to load profile");
    }

    const data = await response.json();
    const currentUser = data.user;

    // If no ID is provided, show the logged-in user's profile.
    // If an ID is provided, only show the current user's profile
    // when that ID matches. Other users still use sample data below.
    let user;

    if (!profileId || Number(profileId) === currentUser.id) {
        user = currentUser;
    } else {
        const users = window.sampleUsers || [];
        user = users.find(item => item.id === Number(profileId));

        if (!user) {
            userProfileContainer.textContent = "User profile not found.";
            return;
        }
    }

    renderUserProfile(user, user.id === currentUser.id);

} catch (error) {
    console.error("Profile loading error:", error);
    userProfileContainer.textContent =
        "Could not load your profile. Check that the backend is running.";
}


}

function renderUserProfile(user, isOwnProfile) {
userProfileContainer.replaceChildren();

const heading = document.createElement("h1");
heading.textContent = user.name;

const bio = document.createElement("p");
bio.textContent = user.bio || "This user hasn't added a bio yet.";

const teachesHeading = document.createElement("h2");
teachesHeading.textContent = "Skills I Can Teach";

const teaches = document.createElement("p");
teaches.textContent =
    (user.teaches || []).join(", ") || "None listed";

const learnsHeading = document.createElement("h2");
learnsHeading.textContent = "Skills I Want to Learn";

const learns = document.createElement("p");
learns.textContent =
    (user.learns || []).join(", ") || "None listed";

userProfileContainer.append(
    heading,
    bio,
    teachesHeading,
    teaches,
    learnsHeading,
    learns
);

// Do not show a Connect button on your own profile.
if (isOwnProfile) {
    const editLink = document.createElement("a");
    editLink.href = "exchange.html";
    editLink.className = "btnprimary";
    editLink.textContent = "Edit My Skills";
    userProfileContainer.appendChild(editLink);
    return;
}

// Keep the existing sample-user connection functionality.
const connectButton = document.createElement("button");
connectButton.className = "btnprimary";
connectButton.textContent = "Connect";

connectButton.addEventListener("click", function () {
    const requests = JSON.parse(
        localStorage.getItem("skillRequests") || "[]"
    );

    const connections = JSON.parse(
        localStorage.getItem("skillConnections") || "[]"
    );

    const alreadyRequested = requests.some(
        request => Number(request.userId) === Number(user.id)
    );

    const alreadyConnected = connections.some(
        connection => Number(connection.userId) === Number(user.id)
    );

    if (alreadyRequested || alreadyConnected) {
        alert("You have already requested or connected with this user.");
        return;
    }

    requests.push({
        userId: user.id,
        status: "pending",
        createdAt: new Date().toISOString()
    });

    localStorage.setItem(
        "skillRequests",
        JSON.stringify(requests)
    );

    alert("Connection request sent!");
    connectButton.textContent = "Request Sent";
    connectButton.disabled = true;
});

userProfileContainer.appendChild(connectButton);


}

loadUserProfile();
