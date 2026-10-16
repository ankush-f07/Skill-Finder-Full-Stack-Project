
const requestsContainer = document.getElementById("requestsContainer");
const connectionsContainer = document.getElementById("connectionsContainer");
const connectionsMessage = document.getElementById("connectionsMessage");

const API_BASE = "http://127.0.0.1:3000";

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

function createUserCard(user, buttons = []) {
    const card = document.createElement("article");
    card.className = "match-card";

    const name = document.createElement("h3");
    name.textContent = user.name || "Unknown user";

    const bio = document.createElement("p");
    bio.textContent = user.bio || "No bio available.";

    const teaches = document.createElement("p");
    teaches.textContent = `Teaches: ${(user.teaches || []).join(", ") || "Not specified"}`;

    const learns = document.createElement("p");
    learns.textContent = `Learns: ${(user.learns || []).join(", ") || "Not specified"}`;

    const profileLink = document.createElement("a");
    profileLink.href = `user-profile.html?id=${user.id}`;
    profileLink.textContent = "View Profile";

    card.append(name, bio, teaches, learns, profileLink);

    buttons.forEach(button => card.appendChild(button));

    return card;
}

async function acceptRequest(requestId) {
    try {
        await apiRequest(`/api/connections/${requestId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "ACCEPTED" })
        });

        await renderConnections();
    } catch (error) {
        alert(error.message);
    }
}

async function rejectRequest(requestId) {
    try {
        await apiRequest(`/api/connections/${requestId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "REJECTED" })
        });

        await renderConnections();
    } catch (error) {
        alert(error.message);
    }
}

async function renderConnections() {
    if (!requestsContainer || !connectionsContainer) return;

    requestsContainer.textContent = "Loading requests...";
    connectionsContainer.textContent = "Loading connections...";

    try {
        const [requestData, connectionData] = await Promise.all([
            apiRequest("/api/connections/requests"),
            apiRequest("/api/connections")
        ]);

        const requests = requestData.requests || [];
        const connections = connectionData.connections || [];

        requestsContainer.replaceChildren();
        connectionsContainer.replaceChildren();

        requests.forEach(request => {
            const user = request.sender;

            const acceptButton = document.createElement("button");
            acceptButton.textContent = "Accept";
            acceptButton.className = "btnprimary";
            acceptButton.addEventListener("click", () => acceptRequest(request.id));

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.className = "btnprimary";
            rejectButton.addEventListener("click", () => rejectRequest(request.id));

            requestsContainer.appendChild(
                createUserCard(user, [acceptButton, rejectButton])
            );
        });

        connections.forEach(user => {
            connectionsContainer.appendChild(createUserCard(user));
        });

        if (requests.length === 0) {
            requestsContainer.textContent = "No pending requests.";
        }

        if (connections.length === 0) {
            connectionsContainer.textContent = "You have no connections yet.";
        }

        if (connectionsMessage) {
            connectionsMessage.textContent =
                `${requests.length} pending request(s) · ${connections.length} connection(s)`;
        }
    } catch (error) {
        requestsContainer.textContent = "Could not load requests.";
        connectionsContainer.textContent = "Could not load connections.";

        if (connectionsMessage) {
            connectionsMessage.textContent =
                `${error.message} If you are logged out, please log in and try again.`;
        }

        console.error("Loading connections failed:", error);
    }
}

if (requestsContainer && connectionsContainer) {
    renderConnections();
}


// Send a connection request to the backend
async function sendConnectionRequest(userId) {
    try {
        const response = await fetch("http://127.0.0.1:3000/api/connections", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                receiverId: Number(userId)
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || `Request failed: ${response.status}`);
        }

        alert("Connection request sent!");
    } catch (error) {
        console.error("Connection request failed:", error);
        alert(error.message || "Could not send connection request.");
    }
}


