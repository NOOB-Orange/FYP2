// Handle and display user information
document.addEventListener('DOMContentLoaded', async () => {
    console.log("✅ dashboard.js loaded successfully!");

    // Fetch user info
    try {
        const userInfo = getUserInfoFromLocalStorage() || await fetchUserInfoFromServer();
        if (userInfo) {
            displayUserInfo(userInfo);
        } else {
            // Redirect to login if user info not available
            redirectToLogin();
        }
    } catch (error) {
        console.error("Failed to retrieve user information:", error);
        showError("Unable to load user information. Please log in again.");
    }

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await logoutUser();
    });

    // Setup change password modal
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeBtn = document.querySelector('.close-btn');

    changePasswordBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target == changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    });

    // Submit change password form
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await changePassword();
    });

    // Update profile (not implemented)
    document.getElementById('updateProfileBtn').addEventListener('click', () => {
        alert('This feature is under development...');
    });

    // Delete account button
    document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
            await deleteAccount();
        }
    });
});

// Get user info from localStorage
function getUserInfoFromLocalStorage() {
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return null;

    try {
        return JSON.parse(userInfoStr);
    } catch (e) {
        console.error("Failed to parse user info from localStorage:", e);
        return null;
    }
}

// Fetch user info from server
async function fetchUserInfoFromServer() {
    try {
        const response = await fetch("https://data.thintuit.com/user/info", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized, redirect to login
                redirectToLogin();
                return null;
            }
            throw new Error("Failed to retrieve user info");
        }

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            return data.user;
        } else {
            throw new Error(data.message || "Failed to retrieve user info");
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
}

// Display user info on the page
function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.name || 'Not set';
    document.getElementById('userEmail').textContent = user.email || 'Not set';
    document.getElementById('userId').textContent = user.id || 'Unknown';

    // Set avatar initial
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('userInitial').textContent = initial;

    if (user.created_at) {
        const date = new Date(user.created_at);
        document.getElementById('userRegTime').textContent = date.toLocaleString('en-US');
    } else {
        document.getElementById('userRegTime').textContent = 'Unknown';
    }
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = "https://data.thintuit.com/login/";
}

// Display error message
function showError(message) {
    alert(message);
}

// Logout user
async function logoutUser() {
    try {
        const response = await fetch("https://data.thintuit.com/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        localStorage.removeItem('userInfo');
        window.location.href = "https://data.thintuit.com/login/";
    } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "https://data.thintuit.com/login/";
    }
}

// Change password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showError("The new passwords do not match.");
        return;
    }

    try {
        const response = await fetch("https://data.thintuit.com/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            }),
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to change password");
        }

        const data = await response.json();

        if (data.success) {
            alert("Password changed successfully!");
            document.getElementById('changePasswordModal').style.display = 'none';
            document.getElementById('changePasswordForm').reset();
        } else {
            throw new Error(data.message || "Failed to change password");
        }
    } catch (error) {
        console.error("Change password error:", error);
        showError(`Failed to change password: ${error.message}`);
    }
}

// Delete account
async function deleteAccount() {
    try {
        const response = await fetch("https://data.thintuit.com/delete-account", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to delete account");
        }

        const data = await response.json();

        if (data.success) {
            alert("Account deleted successfully.");
            localStorage.removeItem('userInfo');
            window.location.href = "https://data.thintuit.com/";
        } else {
            throw new Error(data.message || "Failed to delete account");
        }
    } catch (error) {
        console.error("Delete account error:", error);
        showError(`Failed to delete account: ${error.message}`);
    }
}
