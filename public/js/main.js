// Secure request interceptor
(function() {
    // Intercept and upgrade all HTTP fetch requests to HTTPS
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && url.startsWith('http:')) {
                url = url.replace('http:', 'https:');
                console.log('[Secure Request Interceptor] Upgraded HTTP to HTTPS:', url);
            }
            return originalFetch(url, options);
        };
    }
})();

async function registerUser(event) {
    event.preventDefault();

    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "Register";
    if (submitButton) {
        submitButton.textContent = "Registering...";
        submitButton.disabled = true;
    }

    const formData = {
        name: document.getElementById("name")?.value.trim() || "",
        email: document.getElementById("email")?.value.trim().toLowerCase() || "",
        password: document.getElementById("password")?.value || ""
    };

    try {
        let response = await fetch("https://dev.thintuit.com/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                name: formData.name, 
                email: formData.email, 
                password: formData.password 
            }),
            credentials: "include"  // if using cookies or similar for authentication
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Registration failed");
        }

        const data = await response.json();
        
        if (data.success) {
            if (document.getElementById("name")) document.getElementById("name").value = "";
            if (document.getElementById("email")) document.getElementById("email").value = "";
            if (document.getElementById("password")) document.getElementById("password").value = "";

            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <p>🎉 Registration successful!</p>
                <p>Please click the "Click to login" link below to proceed.</p>
            `;

            const form = document.querySelector('form');
            if (form) {
                form.parentNode.insertBefore(successMessage, form.nextSibling);
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } else {
                alert("Registration successful! Please click \"Already have an account? Click to login\" to continue.");
            }

            console.log("Registration successful. Please manually click the login link.");
        } else {
            throw new Error(data.message || "Registration failed");
        }

    } catch (error) {
        console.error("Registration error:", error);
        alert(`Registration failed: ${error.message}`);
    } finally {
        if (submitButton) {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ main.js loaded successfully! Version: 2025-5-14 Secure Enhanced");
});
