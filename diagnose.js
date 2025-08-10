// 测试脚本 - 直接在浏览器控制台运行
console.log('🔍 开始诊断 All Clicks 问题...');

// 1. 检查全局变量
console.log('1. 全局变量检查:');
console.log('- COUNT_API_BASE:', COUNT_API_BASE);
console.log('- COUNT_NAMESPACE:', COUNT_NAMESPACE);
console.log('- COUNT_KEY:', COUNT_KEY);
console.log('- PANTRY_ID:', PANTRY_ID);
console.log('- PANTRY_BASKET:', PANTRY_BASKET);

// 2. 检查DOM元素
console.log('\n2. DOM元素检查:');
console.log('- cpsCountDisplay:', !!document.getElementById('cpsCount'));
console.log('- currentCpsCountDisplay:', !!document.getElementById('currentCpsCount'));

// 3. 测试API连接
async function testAPI() {
    console.log('\n3. 测试API连接:');
    
    try {
        const url = `${COUNT_API_BASE}/get/${COUNT_NAMESPACE}/${COUNT_KEY}`;
        console.log('测试URL:', url);
        
        const response = await fetch(url);
        console.log('响应状态:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('响应数据:', data);
        } else {
            console.log('响应失败:', response.status);
        }
    } catch (error) {
        console.log('网络错误:', error.message);
    }
}

// 4. 手动测试Worker
async function testWorker() {
    console.log('\n4. 测试Worker:');
    
    try {
        const workerUrl = 'https://silent-frost-93d1.2296744453m.workers.dev/get/lizardclick_online/all_clicks';
        console.log('Worker URL:', workerUrl);
        
        const response = await fetch(workerUrl);
        console.log('Worker响应状态:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Worker响应数据:', data);
        } else {
            console.log('Worker响应失败:', response.status);
            const text = await response.text();
            console.log('Worker响应文本:', text);
        }
    } catch (error) {
        console.log('Worker网络错误:', error.message);
    }
}

// 运行测试
testAPI();
testWorker();

// 5. 检查全局状态
console.log('\n5. 全局状态检查:');
console.log('- globalClickCount:', globalClickCount);
console.log('- globalCountAvailable:', globalCountAvailable);