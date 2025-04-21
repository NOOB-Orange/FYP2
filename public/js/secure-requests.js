// 安全请求拦截模块 - 确保所有请求都使用HTTPS
(function() {
    // 强制页面使用HTTPS
    if (window.location.protocol === 'http:') {
        window.location.href = window.location.href.replace('http:', 'https:');
    }
    
    // 拦截并修改所有fetch请求，确保使用HTTPS
    if(window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            // 如果URL是字符串且以http://开头，则转换为https://
            if(typeof url === 'string' && url.startsWith('http:')) {
                const secureUrl = url.replace('http:', 'https:');
                console.log('[安全请求拦截] 已将HTTP请求升级为HTTPS:', url, '->', secureUrl);
                url = secureUrl;
            }
            
            // 将data.thintuit.com的API请求重定向到dev.thintuit.com:41285
            if(typeof url === 'string' && url.includes('data.thintuit.com') && 
               (url.includes('/login') || url.includes('/register') || 
                url.includes('/user') || url.includes('/logout') || 
                url.includes('/change-password') || url.includes('/delete-account'))) {
                const newUrl = url.replace('data.thintuit.com', 'dev.thintuit.com:41285');
                console.log('[安全请求拦截] 已将API请求重定向:', url, '->', newUrl);
                url = newUrl;
            }
            
            // 处理相对路径API请求，确保指向dev.thintuit.com:41285
            if(typeof url === 'string' && url.startsWith('/') && 
               (url.includes('/login') || url.includes('/register') || 
                url.includes('/user') || url.includes('/logout') || 
                url.includes('/change-password') || url.includes('/delete-account'))) {
                const newUrl = 'https://dev.thintuit.com:41285' + url;
                console.log('[安全请求拦截] 已将相对路径API请求转换为绝对路径:', url, '->', newUrl);
                url = newUrl;
            }
            
            // 处理localhost:41284和localhost:41285的情况，将其转换为dev.thintuit.com:41285
            if(typeof url === 'string' && (url.includes('41284') || url.includes('41285'))) {
                // 移除端口，使用默认HTTPS端口，因为已经有代理
                const newUrl = url.replace(/http(s)?:\/\/[^\/]+:(41284|41285)/g, 'https://dev.thintuit.com:41285');
                console.log('[安全请求拦截] 已重写端口请求:', url, '->', newUrl);
                url = newUrl;
            }
            
            // 确保选项对象存在
            if (!options) {
                options = {};
            }
            
            // 确保headers对象存在
            if (!options.headers) {
                options.headers = {};
            }
            
            // 添加必要的CORS相关头
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json';
            }
            
            return originalFetch(url, options);
        };
        console.log('[安全请求拦截] 已成功拦截fetch API');
    }
    
    // 拦截并修改所有XHR请求，确保使用HTTPS
    if(window.XMLHttpRequest) {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            // 如果URL是字符串且以http://开头，则转换为https://
            if(typeof url === 'string' && url.startsWith('http:')) {
                const secureUrl = url.replace('http:', 'https:');
                console.log('[安全请求拦截] 已将XHR HTTP请求升级为HTTPS:', url, '->', secureUrl);
                url = secureUrl;
            }
            
            // 处理localhost:41284和localhost:41285的情况，将其转换为dev.thintuit.com
            if(typeof url === 'string' && (url.includes('41284') || url.includes('41285'))) {
                // 移除端口，使用默认HTTPS端口，因为已经有代理
                const newUrl = url.replace(/http(s)?:\/\/[^\/]+:(41284|41285)/g, 'https://dev.thintuit.com');
                console.log('[安全请求拦截] 已重写XHR端口请求:', url, '->', newUrl);
                url = newUrl;
            }
            
            return originalOpen.call(this, method, url, ...rest);
        };
        console.log('[安全请求拦截] 已成功拦截XHR API');
    }
    
    console.log('[安全请求拦截] 模块已加载完成');
})(); 