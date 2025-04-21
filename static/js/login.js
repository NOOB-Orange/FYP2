async function loginUser(event) {
    event.preventDefault();

    try {
        // 获取表单元素
        const emailField = document.getElementById("email");
        const passwordField = document.getElementById("password");
        
        if (!emailField || !passwordField) {
            console.error("找不到登录表单字段");
            alert("登录表单加载错误，请刷新页面重试");
            return;
        }
        
        // 获取按钮元素 - 修正选择器语法
        const submitButton = document.querySelector('button[type=submit]');
        if (submitButton) {
            submitButton.textContent = "登录中...";
            submitButton.disabled = true;
        }
        
        const formData = {
            email: emailField.value.trim().toLowerCase(),
            password: passwordField.value
        };

        console.log("正在提交登录数据:", { email: formData.email });
        
        // API地址，根据老师的说明，FastAPI已被代理到dev.thintuit.com
        const apiUrl = 'https://dev.thintuit.com/login';
            
        console.log("正在尝试登录请求:", apiUrl);

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

        console.log("API响应状态:", response.status);
        
        if (!response.ok) {
            let errorMessage = "登录失败";
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || "登录失败";
            } catch (e) {
                console.error("解析错误响应失败:", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("API响应数据:", data);
        
        if (data.success) {
            localStorage.setItem('is_logged_in', 'true');
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_role', data.user.role);

            console.log("登录成功，即将跳转到:", data.redirect_url || "https://dev.thintuit.com/");
            window.location.href = data.redirect_url || "https://dev.thintuit.com/";
        } else {
            throw new Error(data.message || "登录失败");
        }

    } catch (error) {
        console.error("登录错误:", error);
        alert(`登录失败: ${error.message}`);
        
        // 恢复按钮状态
        const submitButton = document.querySelector('button[type=submit]');
        if (submitButton) {
            submitButton.textContent = "登录";
            submitButton.disabled = false;
        }
    }
}

// 页面加载完成时输出日志
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ login.js 已成功加载！");
    
    // 尝试登录表单监听
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
        console.log("✅ 已添加登录表单事件监听器");
    } else {
        console.log("⚠️ 未找到登录表单，可能不在登录页面");
    }
}); 