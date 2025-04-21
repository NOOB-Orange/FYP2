async function registerUser(event) {
    event.preventDefault();

    // 获取按钮元素
    const submitButton = document.querySelector('button[type="submit"]');
    // 保存原始文本
    const originalButtonText = submitButton ? submitButton.textContent : "注册";
    // 更改按钮文本并禁用
    if (submitButton) {
        submitButton.textContent = "注册中...";
        submitButton.disabled = true;
    }

    const formData = {
        name: document.getElementById("name")?.value.trim() || "",
        email: document.getElementById("email")?.value.trim().toLowerCase() || "",
        password: document.getElementById("password")?.value || ""
    };

    try {
        console.log(`正在提交到: https://dev.thintuit.com/register 时间戳: ${new Date().toISOString()}`);
        const response = await fetch("https://dev.thintuit.com/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "注册失败");
        }

        const data = await response.json();
        
        if (data.success) {
            // 清空表单
            if (document.getElementById("name")) document.getElementById("name").value = "";
            if (document.getElementById("email")) document.getElementById("email").value = "";
            if (document.getElementById("password")) document.getElementById("password").value = "";
            
            // 创建成功消息
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <p>🎉 注册成功！</p>
                <p>请点击下方的"点击登录"链接进行登录。</p>
            `;
            
            // 显示成功消息
            const form = document.querySelector('form');
            if (form) {
                form.parentNode.insertBefore(successMessage, form.nextSibling);
                
                // 设置定时器自动移除成功消息
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } else {
                // 备用方案：如果DOM元素未找到，则使用alert
                alert("注册成功！请点击\"已有账户？点击登录\"继续操作。");
            }
            
            // 明确不跳转，留在当前页面
            console.log("注册成功，请手动点击登录链接");
        } else {
            throw new Error(data.message || "注册失败");
        }

    } catch (error) {
        console.error("注册错误:", error);
        alert(`注册失败: ${error.message}`);
    } finally {
        // 恢复按钮状态
        if (submitButton) {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

// 设置全局标志，表示JS已加载
window.jsLoaded = true;

// 页面加载完成时输出日志并绑定注册表单事件
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ main.js 已成功加载！版本：2023-04-20-FastAPI版-" + new Date().toISOString());
    console.log("✅ 测试更新成功：2023-04-20-最新版");
    
    // 查找并绑定注册表单提交事件
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
        console.log("✅ 注册表单事件已绑定");
    } else {
        console.error("❌ 无法找到注册表单！请检查HTML中的id是否为registerForm");
    }
});
