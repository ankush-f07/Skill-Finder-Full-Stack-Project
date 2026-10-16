const signupForm = document.getElementById("signupForm");

const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const formMessage = document.getElementById("formMessage");

signupForm.addEventListener("submit", async function (event) {
event.preventDefault();


formMessage.textContent = "";
formMessage.className = "";

const nameValue = fullName.value.trim();
const emailValue = email.value.trim();
const passwordValue = password.value;
const confirmPasswordValue = confirmPassword.value;

// Validate name
if (nameValue.length < 2) {
    formMessage.textContent = "Please enter a valid name.";
    formMessage.classList.add("failure");
    return;
}

// Validate email
if (!email.checkValidity()) {
    formMessage.textContent = "Please enter a valid email address.";
    formMessage.classList.add("failure");
    return;
}

// Validate password
if (passwordValue.length < 8) {
    formMessage.textContent = "Password must contain at least 8 characters.";
    formMessage.classList.add("failure");
    return;
}

// Check password confirmation
if (passwordValue !== confirmPasswordValue) {
    formMessage.textContent = "Passwords do not match.";
    formMessage.classList.add("failure");
    return;
}

try {
    formMessage.textContent = "Creating your account...";

    const response = await fetch(
        "http://localhost:3000/api/auth/register",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: nameValue,
                email: emailValue,
                password: passwordValue
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        formMessage.textContent =
            data.error || "Unable to create your account.";
        formMessage.classList.add("failure");
        return;
    }

    formMessage.textContent =
        "Account created successfully! Redirecting to login...";
    formMessage.classList.add("success");

    signupForm.reset();

    setTimeout(function () {
        window.location.href = "login.html";
    }, 1200);

} catch (error) {
    console.error("Signup error:", error);

    formMessage.textContent =
        "Could not connect to the server. Please make sure the backend is running.";
    formMessage.classList.add("failure");
}


});
