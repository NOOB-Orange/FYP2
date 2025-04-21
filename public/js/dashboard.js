// 用户信息处理和显示
document.addEventListener('DOMContentLoaded', async () => {
    console.log("✅ dashboard.js 已成功加载！");
    
    // 获取用户信息
    try {
        const userInfo = getUserInfoFromLocalStorage() || await fetchUserInfoFromServer();
        if (userInfo) {
            displayUserInfo(userInfo);
        } else {
            // 如果没有用户信息，重定向到登录页面
            redirectToLogin();
        }
    } catch (error) {
        console.error("获取用户信息失败:", error);
        showError("无法加载用户信息，请重新登录");
    }

    // 设置注销按钮
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await logoutUser();
    });

    // 设置密码修改按钮和模态框
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

    // 设置密码修改表单提交
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await changePassword();
    });

    // 设置更新个人信息按钮
    document.getElementById('updateProfileBtn').addEventListener('click', () => {
        alert('此功能正在开发中...');
    });

    // 设置删除账户按钮
    document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
        if (confirm('您确定要删除账户吗？此操作不可恢复！')) {
            await deleteAccount();
        }
    });
});

// 从本地存储获取用户信息
function getUserInfoFromLocalStorage() {
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return null;
    
    try {
        return JSON.parse(userInfoStr);
    } catch (e) {
        console.error("解析本地用户信息失败:", e);
        return null;
    }
}

// 从服务器获取用户信息
async function fetchUserInfoFromServer() {
    try {
        const response = await fetch("https://data.thintuit.com/user/info", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 401) {
                // 未授权，需要重新登录
                redirectToLogin();
                return null;
            }
            throw new Error("获取用户信息失败");
        }

        const data = await response.json();
        
        if (data.success) {
            // 将用户信息存储在本地
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            return data.user;
        } else {
            throw new Error(data.message || "获取用户信息失败");
        }
    } catch (error) {
        console.error("获取用户信息错误:", error);
        return null;
    }
}

// 显示用户信息
function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.name || '未设置';
    document.getElementById('userEmail').textContent = user.email || '未设置';
    document.getElementById('userId').textContent = user.id || '未知';
    
    // 设置用户头像初始字母
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('userInitial').textContent = initial;
    
    // 如果有注册时间，则显示
    if (user.created_at) {
        const date = new Date(user.created_at);
        document.getElementById('userRegTime').textContent = date.toLocaleString('zh-CN');
    } else {
        document.getElementById('userRegTime').textContent = '未知';
    }
}

// 重定向到登录页面
function redirectToLogin() {
    window.location.href = "https://data.thintuit.com/login/";
}

// 显示错误消息
function showError(message) {
    alert(message);
}

// 注销用户
async function logoutUser() {
    try {
        const response = await fetch("https://data.thintuit.com/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        // 清除本地存储的用户信息
        localStorage.removeItem('userInfo');
        
        // 无论服务器响应如何，都重定向到登录页面
        window.location.href = "https://data.thintuit.com/login/";
    } catch (error) {
        console.error("注销错误:", error);
        // 发生错误时也重定向到登录页面
        window.location.href = "https://data.thintuit.com/login/";
    }
}

// 修改密码
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showError("两次输入的新密码不一致");
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
            throw new Error(errorData.detail || "修改密码失败");
        }

        const data = await response.json();
        
        if (data.success) {
            alert("密码修改成功！");
            document.getElementById('changePasswordModal').style.display = 'none';
            // 清除表单
            document.getElementById('changePasswordForm').reset();
        } else {
            throw new Error(data.message || "修改密码失败");
        }
    } catch (error) {
        console.error("修改密码错误:", error);
        showError(`修改密码失败: ${error.message}`);
    }
}

// 删除账户
async function deleteAccount() {
    try {
        const response = await fetch("https://data.thintuit.com/delete-account", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "删除账户失败");
        }

        const data = await response.json();
        
        if (data.success) {
            alert("账户已成功删除");
            // 清除本地存储的用户信息
            localStorage.removeItem('userInfo');
            // 重定向到首页
            window.location.href = "https://data.thintuit.com/";
        } else {
            throw new Error(data.message || "删除账户失败");
        }
    } catch (error) {
        console.error("删除账户错误:", error);
        showError(`删除账户失败: ${error.message}`);
    }
} 