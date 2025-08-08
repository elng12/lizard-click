// Game Variables
let clickCount = 0;
let soundEnabled = true;
let audioPool = [];
let currentAudioIndex = 0;
let sou

// Game Elements
const lizardButton = document.getElementById('lizardButton');
const clickCountDisplay = document.getElementById('clickCount');
const cpsCountDisplay = document.getElementById('cpsCount');
const flyingLizardsContainer = document.getElementById('flyingLizards');

// Control buttons
const soundBtn = document.getElementById('soundBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const shareBtn = document.getElementById('shareBtn');
const infoBtn = document.getElementById('infoBtn');

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Initialize game
    initializeGame();
});

// Initialize audio system (based on reference website)
function initializeAudio() {
    // Create optimized audio pool with better memory management
    const poolSize = 5;
    for (let i = 0; i < poolSize; i++) {
        const audio = new Audio('lizard.wav'); // They use a lizard.wav file
        audio.preload = 'auto';
        audio.volume = 1.0;
        audioPool.push(audio);
    }
    
    // Try to initialize Web Audio API for better performance
    try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        loadAudioBuffer();
    } catch (error) {
        console.log('Web Audio API not supported, using HTML Audio fallback');
    }
}

// Load audio buffer for Web Audio API (from reference website)
async function loadAudioBuffer() {
    if (audioBuffer) return audioBuffer;
    try {
        const audioCtx = window.audioContext;
        const response = await fetch('lizard.wav');
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.log('Failed to load audio buffer, falling back to HTML Audio:', error);
        return null;
    }
}

// Play click sound (copied from reference website approach)
async function playClickSound() {
    if (!soundEnabled) return;
    
    // Try Web Audio API first for better performance
    if (audioBuffer && window.audioContext) {
        try {
            const audioCtx = window.audioContext;
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
            return;
        } catch (error) {
            console.log('Web Audio API failed, falling back to HTML Audio:', error);
        }
    }
    
    // Fallback to HTML Audio API with optimized approach (from reference)
    const audio = audioPool[currentAudioIndex];
    // Stop and reset current audio to prevent overlap issues
    if (!audio.paused) {
        audio.pause();
    }
    audio.currentTime = 0;
    
    // Simple play with minimal error handling to avoid promise stacking
    try {
        await audio.play();
    } catch (error) {
        // Move to next audio instance if current one fails
        currentAudioIndex = (currentAudioIndex + 1) % audioPool.length;
    }
    
    currentAudioIndex = (currentAudioIndex + 1) % audioPool.length;
}

// Game Initialization
function initializeGame() {
    console.log('Initializing game...');
    console.log('lizardButton:', lizardButton);
    console.log('clickCountDisplay:', clickCountDisplay);
    console.log('cpsCountDisplay:', cpsCountDisplay);
    
    // Initialize audio
    initializeAudio();
    
    // Load saved data
    loadGameData();
    
    // Set up event listeners
    if (lizardButton) {
        lizardButton.addEventListener('click', handleLizardClick);
        console.log('Click listener added to lizard button');
    } else {
        console.error('Lizard button not found!');
    }
    
    // Set up control button listeners
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareGame);
    }
    
    if (infoBtn) {
        infoBtn.addEventListener('click', showInfo);
    }
    
    // Update display
    updateDisplay();
}

// Handle lizard button click
function handleLizardClick(event) {
    // Resume audio context if needed (for browser autoplay policy)
    if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
    
    // Increment click count
    clickCount++;
    
    // Play click sound
    playClickSound();
    
    // 立即更新显示
    updateDisplay();
    
    // Create click effect
    createClickEffect(event);
    
    // Create flying lizard
    createFlyingLizard();
    
    // Save data
    saveGameData();
    
    // Simple button animation
    animateButton();
    
    // Debug log
    console.log(`🦎 点击 #${clickCount}`);
}

// 记录详细的点击信息
function recordClickDetails(event, timestamp) {
    const rect = lizardButton.getBoundingClientRect();
    const clickRecord = {
        id: clickCount,
        timestamp: timestamp,
        date: new Date(timestamp).toISOString(),
        position: {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            screenX: event.clientX,
            screenY: event.clientY
        },
        currentCPS: currentCPS,
        totalClicks: clickCount,
        gameTime: timestamp - gameStartTime,
        timeSinceLastClick: clickHistory.length > 0 ? timestamp - clickHistory[clickHistory.length - 1].timestamp : 0
    };
    
    // 添加到历史记录
    clickHistory.push(clickRecord);
    
    // 保持历史记录在合理范围内（最多保存最近1000次点击）
    if (clickHistory.length > 1000) {
        clickHistory.shift();
    }
}

// 在控制台输出点击记录
function logClickRecord() {
    const lastClick = clickHistory[clickHistory.length - 1];
    console.log(`🦎 点击记录 #${lastClick.id}:`, {
        时间: lastClick.date,
        位置: `(${Math.round(lastClick.position.x)}, ${Math.round(lastClick.position.y)})`,
        当前CPS: lastClick.currentCPS,
        总点击数: lastClick.totalClicks,
        游戏时长: `${Math.round(lastClick.gameTime / 1000)}秒`,
        距上次点击: `${lastClick.timeSinceLastClick}ms`
    });
}

// Create click effect at cursor position
function createClickEffect(event) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = '+1';
    
    const rect = lizardButton.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    effect.style.left = (rect.left + x) + 'px';
    effect.style.top = (rect.top + y) + 'px';
    effect.style.color = '#4CAF50';
    effect.style.fontWeight = 'bold';
    
    document.body.appendChild(effect);
    
    // Animate and remove
    setTimeout(() => effect.classList.add('animate'), 10);
    setTimeout(() => {
        if (effect.parentNode) {
            document.body.removeChild(effect);
        }
    }, 1000);
}



// Create flying lizard animation
function createFlyingLizard() {
    if (!flyingLizardsContainer) return;
    
    // Create more lizards based on total clicks (every 10 clicks = 1 more lizard)
    const numLizards = Math.min(Math.floor(clickCount / 10) + 1, 5);
    
    for (let i = 0; i < numLizards; i++) {
        setTimeout(() => {
            const lizard = document.createElement('div');
            lizard.className = 'flying-lizard';
            lizard.textContent = '🦎';
            
            // Random position
            const x = Math.random() * (window.innerWidth - 100);
            const y = Math.random() * (window.innerHeight * 0.6) + (window.innerHeight * 0.2);
            
            lizard.style.left = x + 'px';
            lizard.style.top = y + 'px';
            
            // Random size based on total clicks
            const size = 1.5 + (clickCount / 100);
            lizard.style.fontSize = Math.min(size, 3) + 'rem';
            
            flyingLizardsContainer.appendChild(lizard);
            
            // Animate
            setTimeout(() => lizard.classList.add('animate'), 10);
            
            // Remove after animation
            setTimeout(() => {
                if (lizard.parentNode) {
                    flyingLizardsContainer.removeChild(lizard);
                }
            }, 2000);
        }, i * 100);
    }
}

// Simple button animation on click
function animateButton() {
    if (!lizardButton) return;
    
    const lizardImage = lizardButton.querySelector('.lizard-image');
    
    // Simple scale animation
    lizardImage.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        lizardImage.style.transform = 'scale(1)';
    }, 100);
}



// Update CPS calculation
function updateCPS() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Remove clicks older than 1 second
    clicksInLastSecond = clicksInLastSecond.filter(time => time > oneSecondAgo);
    
    // Update current CPS
    currentCPS = clicksInLastSecond.length;
    
    // 更新最高CPS记录
    if (currentCPS > maxCPS) {
        maxCPS = currentCPS;
        console.log(`🏆 新的CPS记录: ${maxCPS}`);
    }
    
    // 更新总游戏时间
    totalPlayTime = now - gameStartTime;
    
    // Update display
    updateDisplay();
}

// Update display counters
function updateDisplay() {
    console.log('Updating display, clickCount:', clickCount);
    
    if (clickCountDisplay) {
        clickCountDisplay.textContent = clickCount;
        console.log('Updated clickCountDisplay to:', clickCount);
    } else {
        console.log('clickCountDisplay not found');
    }
    
    if (cpsCountDisplay) {
        // CPS显示实时点击次数
        cpsCountDisplay.textContent = clickCount;
        console.log('Updated cpsCountDisplay to:', clickCount);
        
        // 添加动画效果
        cpsCountDisplay.style.transform = 'scale(1.1)';
        cpsCountDisplay.style.color = '#FF9800';
        
        setTimeout(() => {
            cpsCountDisplay.style.transform = 'scale(1)';
        }, 150);
    } else {
        console.log('cpsCountDisplay not found');
    }
}

// 获取点击统计信息
function getClickStats() {
    const currentTime = Date.now();
    const sessionTime = (currentTime - gameStartTime) / 1000;
    
    return {
        totalClicks: clickCount,
        currentCPS: currentCPS,
        maxCPS: maxCPS,
        sessionTime: Math.round(sessionTime),
        averageCPS: sessionTime > 0 ? (clickCount / sessionTime).toFixed(2) : 0,
        clickHistory: clickHistory,
        recentClicks: clickHistory.slice(-10) // 最近10次点击
    };
}

// 导出点击数据（用于调试或分析）
function exportClickData() {
    const stats = getClickStats();
    const dataStr = JSON.stringify(stats, null, 2);
    console.log('📊 完整点击数据:', stats);
    
    // 创建下载链接（可选）
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lizard-click-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return stats;
}

// Control button functions
function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
        soundBtn.title = soundEnabled ? 'Sound On' : 'Sound Off';
    }
    console.log('Sound', soundEnabled ? 'enabled' : 'disabled');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen not supported:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function shareGame() {
    if (navigator.share) {
        navigator.share({
            title: 'Lizard Button Clicker',
            text: `I just clicked ${clickCount} times! Can you beat my score?`,
            url: window.location.href
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const text = `I just clicked ${clickCount} times in Lizard Button Clicker! Can you beat my score? ${window.location.href}`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Score copied to clipboard!');
        }).catch(() => {
            alert(`My score: ${clickCount} clicks! Try to beat it at ${window.location.href}`);
        });
    }
}

function showInfo() {
    const currentSessionTime = Math.round((Date.now() - gameStartTime) / 1000);
    const averageCPS = currentSessionTime > 0 ? (clickCount / currentSessionTime).toFixed(2) : 0;
    
    alert(`🦎 Lizard Button Clicker - 详细统计

📊 当前数据:
• 总点击数: ${clickCount.toLocaleString()}
• 当前CPS: ${currentCPS}
• 最高CPS: ${maxCPS}
• 本次游戏时长: ${currentSessionTime}秒
• 平均CPS: ${averageCPS}

📈 点击记录:
• 历史记录: ${clickHistory.length}条
• 最近点击: ${clickHistory.length > 0 ? new Date(clickHistory[clickHistory.length - 1].timestamp).toLocaleTimeString() : '无'}

💡 提示:
• 点击越快CPS越高！
• 更高的CPS会产生更多特效
• 所有数据自动保存
• 按F12查看详细点击日志

Have fun clicking! 🎮`);
}

// Save game data to localStorage
function saveGameData() {
    try {
        localStorage.setItem('lizardClickData', JSON.stringify({
            clickCount: clickCount
        }));
    } catch (error) {
        console.log('Failed to save game data:', error);
    }
}

// Load game data from localStorage
function loadGameData() {
    try {
        const saved = localStorage.getItem('lizardClickData');
        if (saved) {
            const data = JSON.parse(saved);
            clickCount = data.clickCount || 0;
            console.log('Loaded clickCount:', clickCount);
        }
    } catch (error) {
        console.log('Failed to load game data:', error);
        clickCount = 0;
    }
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// FAQ Accordion Functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
        const faqItem = this.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const toggle = this.querySelector('.faq-toggle');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.querySelector('.faq-answer').classList.remove('active');
                item.querySelector('.faq-toggle').textContent = '+';
                item.querySelector('.faq-toggle').style.transform = 'rotate(0deg)';
            }
        });
        
        // Toggle current FAQ item
        answer.classList.toggle('active');
        if (answer.classList.contains('active')) {
            toggle.textContent = '−';
            toggle.style.transform = 'rotate(180deg)';
        } else {
            toggle.textContent = '+';
            toggle.style.transform = 'rotate(0deg)';
        }
    });
});

// Header Background on Scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .step, .benefit, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Play Now Button Functionality - scroll to game
document.querySelectorAll('.btn-play').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Scroll to hero section where the game is
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Add a little highlight effect to the game button
            setTimeout(() => {
                if (lizardButton) {
                    lizardButton.style.transform = 'scale(1.1)';
                    lizardButton.style.boxShadow = '0 0 30px rgba(76, 175, 80, 0.5)';
                    
                    setTimeout(() => {
                        lizardButton.style.transform = '';
                        lizardButton.style.boxShadow = '';
                    }, 1000);
                }
            }, 500);
        }
    });
});

// Add some interactive effects to the hero lizard
const lizardAnimation = document.querySelector('.lizard-animation');
if (lizardAnimation) {
    lizardAnimation.addEventListener('click', function() {
        this.style.transform = 'scale(1.2) rotate(360deg)';
        this.style.transition = 'transform 0.5s ease';
        
        setTimeout(() => {
            this.style.transform = 'scale(1) rotate(0deg)';
        }, 500);
    });
}

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
    const scrolled = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // 在控制台提供一些有用的函数
    console.log(`
🦎 Lizard Click 调试工具已加载！

可用的控制台命令:
• getClickStats() - 获取详细统计信息
• exportClickData() - 导出点击数据
• clickHistory - 查看点击历史记录
• clearClickHistory() - 清除点击历史
• resetGame() - 重置游戏数据

开始点击蜥蜴，每次点击都会在控制台显示详细记录！
    `);
});

// 全局函数：清除点击历史
window.clearClickHistory = function() {
    clickHistory = [];
    console.log('🗑️ 点击历史已清除');
};

// 全局函数：重置游戏
window.resetGame = function() {
    if (confirm('确定要重置所有游戏数据吗？')) {
        clickCount = 0;
        clickHistory = [];
        maxCPS = 0;
        currentCPS = 0;
        clicksInLastSecond = [];
        gameStartTime = Date.now();
        totalPlayTime = 0;
        
        localStorage.removeItem('lizardClickData');
        updateDisplay();
        
        console.log('🔄 游戏数据已重置');
        alert('游戏数据已重置！');
    }
};

// 全局函数：获取统计信息
window.getClickStats = getClickStats;
window.exportClickData = exportClickData;