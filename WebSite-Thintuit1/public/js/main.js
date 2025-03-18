async function registerUser(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim().toLowerCase(),
        password: document.getElementById("password").value
    };

    // ✅ 强制使用 HTTPS + 隐藏端口
    const baseURL = `https://dev.thintuit.com/register`;

    try {
        const response = await fetch(baseURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
            credentials: "include"  // 允许发送 Cookie（如果使用会话）
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "注册失败");
        }

        alert("注册成功！");
        window.location.href = "/login";

    } catch (error) {
        console.error("注册错误:", error);
        alert(`注册失败: ${error.message}`);
    }
    console.log("✅ main.js 已成功加载！");
}
