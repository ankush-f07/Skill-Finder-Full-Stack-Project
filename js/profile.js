const teachList = document.getElementById("teachList");
const learnList = document.getElementById("learnList");
const profileMessage = document.getElementById("profileMessage");

async function loadProfile() {
try {
profileMessage.textContent = "Loading your skills...";


    const response = await fetch(
        "http://127.0.0.1:3000/api/auth/me",
        {
            credentials: "include"
        }
    );

    if (response.status === 401) {
        profileMessage.textContent =
            "Please log in to view your skills.";

        teachList.replaceChildren();
        learnList.replaceChildren();
        return;
    }

    if (!response.ok) {
        throw new Error("Failed to load profile");
    }

    const data = await response.json();
    const profile = data.user;

    displaySkills(profile.teaches || [], teachList);
    displaySkills(profile.learns || [], learnList);

    if (
        (profile.teaches || []).length === 0 &&
        (profile.learns || []).length === 0
    ) {
        profileMessage.textContent =
            "You haven't saved your skills yet. Start by selecting your skills.";
    } else {
        profileMessage.textContent = "";
    }

} catch (error) {
    console.error("Profile loading error:", error);

    profileMessage.textContent =
        "Could not load your skills. Please check your server connection.";
}


}

function displaySkills(skills, listElement) {
listElement.replaceChildren();


skills.forEach(function (skill) {
    const listItem = document.createElement("li");
    listItem.textContent = skill;
    listElement.appendChild(listItem);
});


}

loadProfile();
