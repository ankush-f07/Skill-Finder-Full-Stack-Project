const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
event.preventDefault();


const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

loginMessage.textContent = "Logging in...";

try {
    const response = await fetch("http://127.0.0.1:3000/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        loginMessage.textContent = data.error || "Login failed.";
        return;
    }

    loginMessage.textContent = "Login successful! Redirecting...";

    window.location.href = "exchange.html";

} catch (error) {
    console.error("Login error:", error);
    loginMessage.textContent =
        "Could not connect to the server. Please try again.";
}


});
