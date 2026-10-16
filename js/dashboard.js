const skillProfile = JSON.parse(
    localStorage.getItem("skillProfile") || "null"
);

const requests = JSON.parse(
    localStorage.getItem("connectionRequests") || "[]"
);

document.getElementById("teachCount").textContent =
    skillProfile ? skillProfile.teach.length : 0;

document.getElementById("learnCount").textContent =
    skillProfile ? skillProfile.learn.length : 0;

document.getElementById("requestCount").textContent =
    requests.length;

const acceptedConnections = requests.filter(function (request) {
    return request.status === "accepted";
});

document.getElementById("acceptedCount").textContent =
    acceptedConnections.length;