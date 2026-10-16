const exchangeForm = document.getElementById("exchangeForm");
const exchangeMessage = document.getElementById("exchangeMessage");

// Load saved skill preferences from the backend
async function loadSkillProfile() {
try {
const response = await fetch("http://127.0.0.1:3000/api/auth/me", {
credentials: "include"
});


    if (response.status === 401) {
        exchangeMessage.style.color = "#DC2626";
        exchangeMessage.textContent = "Please log in to manage your skills.";
        return;
    }

    if (!response.ok) {
        throw new Error("Failed to load profile");
    }

    const data = await response.json();
    const user = data.user;

    document.querySelectorAll('input[name="teach"]').forEach(function (checkbox) {
        checkbox.checked = (user.teaches || []).includes(checkbox.value);
    });

    document.querySelectorAll('input[name="learn"]').forEach(function (checkbox) {
        checkbox.checked = (user.learns || []).includes(checkbox.value);
    });

} catch (error) {
    console.error("Error loading skills:", error);
    exchangeMessage.style.color = "#DC2626";
    exchangeMessage.textContent =
        "Could not connect to the server. Make sure the backend is running.";
}


}

// Save updated skill preferences to the backend
exchangeForm.addEventListener("submit", async function (event) {
event.preventDefault();


const teachSkills = document.querySelectorAll(
    'input[name="teach"]:checked'
);

const learnSkills = document.querySelectorAll(
    'input[name="learn"]:checked'
);

if (teachSkills.length === 0 || learnSkills.length === 0) {
    exchangeMessage.style.color = "#DC2626";
    exchangeMessage.textContent =
        "Please select at least one skill in both sections.";
    return;
}

const profile = {
    teaches: Array.from(teachSkills).map(skill => skill.value),
    learns: Array.from(learnSkills).map(skill => skill.value)
};

try {
    const response = await fetch(
        "http://127.0.0.1:3000/api/users/me/skills",
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profile)
        }
    );

    const data = await response.json();

    if (response.status === 401) {
        exchangeMessage.style.color = "#DC2626";
        exchangeMessage.textContent = "Please log in before saving your skills.";
        return;
    }

    if (!response.ok) {
        throw new Error(data.error || "Failed to save skills");
    }

    exchangeMessage.style.color = "#15803D";
    exchangeMessage.textContent = "Your skill preferences have been saved!";

} catch (error) {
    console.error("Error saving skills:", error);
    exchangeMessage.style.color = "#DC2626";
    exchangeMessage.textContent =
        "Could not save your skills. Check the server connection.";
}


});

// Load the profile when the page opens
loadSkillProfile();
