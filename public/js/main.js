// 安全请求拦截逻辑
(function() {
    // 拦截并修改所有 fetch 请求，自动升级 http → https
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && url.startsWith('http:')) {
                url = url.replace('http:', 'https:');
                console.log('[安全请求拦截] 已将 HTTP 请求升级为 HTTPS:', url);
            }
            return originalFetch(url, options);
        };
    }
})();

async function registerUser(event) {
    event.preventDefault();

    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "注册";
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
            credentials: "include"  // 如果你用cookie等认证
        });
        

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "注册失败");
        }

        const data = await response.json();
        
        if (data.success) {
            if (document.getElementById("name")) document.getElementById("name").value = "";
            if (document.getElementById("email")) document.getElementById("email").value = "";
            if (document.getElementById("password")) document.getElementById("password").value = "";

            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <p>🎉 注册成功！</p>
                <p>请点击下方的"点击登录"链接进行登录。</p>
            `;

            const form = document.querySelector('form');
            if (form) {
                form.parentNode.insertBefore(successMessage, form.nextSibling);
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } else {
                alert("注册成功！请点击\"已有账户？点击登录\"继续操作。");
            }

            console.log("注册成功，请手动点击登录链接");
        } else {
            throw new Error(data.message || "注册失败");
        }

    } catch (error) {
        console.error("注册错误:", error);
        alert(`注册失败: ${error.message}`);
    } finally {
        if (submitButton) {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ main.js 已成功加载！版本：2025-04-21 安全增强版");
});
