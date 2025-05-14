async function loginUser(event) {
    event.preventDefault();

    try {
        // Get form elements
        const emailField = document.getElementById("email");
        const passwordField = document.getElementById("password");

        if (!emailField || !passwordField) {
            console.error("Login form fields not found");
            alert("Login form failed to load. Please refresh the page and try again.");
            return;
        }

        // Get submit button
        const submitButton = document.querySelector('button[type=submit]');
        if (submitButton) {
            submitButton.textContent = "Logging in...";
            submitButton.disabled = true;
        }

        const formData = {
            email: emailField.value.trim().toLowerCase(),
            password: passwordField.value
        };

        console.log("Submitting login data:", { email: formData.email });

        // API endpoint - FastAPI is proxied via dev.thintuit.com
        const apiUrl = 'https://dev.thintuit.com/login';

        console.log("Attempting login request to:", apiUrl);

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://data.thintuit.com"
            },
            body: JSON.stringify(formData),
            credentials: "include"
        });

        console.log("API response status:", response.status);

        if (!response.ok) {
            let errorMessage = "Login failed";
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || "Login failed";
            } catch (e) {
                console.error("Failed to parse error response:", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("API response data:", data);

        if (data.success) {
            localStorage.setItem('is_logged_in', 'true');
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_role', data.user.role); // for role-based rendering

            console.log("Login successful. Redirecting to:", data.redirect_url || "https://dev.thintuit.com/");
            window.location.href = data.redirect_url || "https://dev.thintuit.com/";
        } else {
            throw new Error(data.message || "Login failed");
        }

    } catch (error) {
        console.error("Login error:", error);
        alert(`Login failed: ${error.message}`);

        // Restore button state
        const submitButton = document.querySelector('button[type=submit]');
        if (submitButton) {
            submitButton.textContent = "Login";
            submitButton.disabled = false;
        }
    }
}

// Log message after page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ login.js loaded successfully!");

    // Try attaching form event listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
        console.log("✅ Login form event listener attached");
    } else {
        console.log("⚠️ Login form not found — likely not on login page");
    }
});
