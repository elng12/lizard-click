// Game Variables
let clickCount = 0;
let soundEnabled = true;

// Runtime Stats and History (initialized to avoid ReferenceError)
let clickHistory = [];
let currentCPS = 0;
let maxCPS = 0;
let clicksInLastSecond = [];
let gameStartTime = Date.now();

// Global click counter (all users) via CountAPI
let globalClickCount = 0;
let globalCountAvailable = false;
// 可被 index.html 通过 window.COUNTER_API_BASE 覆盖为你自己的后端域名
const COUNT_API_BASE = (typeof window !== 'undefined' && window.COUNTER_API_BASE)
    ? window.COUNTER_API_BASE
    : 'https://api.countapi.xyz';
const COUNT_NAMESPACE = 'lizardclick_online';
const COUNT_KEY = 'all_clicks';

// Pantry fallback configuration (pure frontend + hosted JSON)
const PANTRY_ID = (typeof window !== 'undefined' && window.PANTRY_ID) ? window.PANTRY_ID : null;
const PANTRY_BASKET = (typeof window !== 'undefined' && window.PANTRY_BASKET) ? window.PANTRY_BASKET : 'lizardclick_global';

// Lightweight fetch with timeout to avoid hanging requests
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal, mode: 'cors', cache: 'no-store' });
        return res;
    } finally {
        clearTimeout(timeout);
    }
}

// Ensure global counter exists and fetch current value
async function initGlobalCount() {
    console.log('🌐 Initializing global counter...');
    console.log('- COUNT_API_BASE:', COUNT_API_BASE);
    console.log('- COUNT_NAMESPACE:', COUNT_NAMESPACE);
    console.log('- COUNT_KEY:', COUNT_KEY);
    
    // Try CountAPI first
    try {
        const url = `${COUNT_API_BASE}/get/${COUNT_NAMESPACE}/${COUNT_KEY}`;
        console.log('📡 Trying GET:', url);
        const res = await fetchWithTimeout(url);
        console.log('📨 GET response:', res.status, res.statusText);
        
        if (res.ok) {
            const data = await res.json();
            globalClickCount = data.value || 0;
            globalCountAvailable = true;
            console.log('✅ Global counter loaded:', globalClickCount);
            updateDisplay();
            return;
        }
    } catch (error) {
        console.log('❌ GET failed:', error.message);
    }

    try {
        const url = `${COUNT_API_BASE}/create?namespace=${encodeURIComponent(COUNT_NAMESPACE)}&key=${encodeURIComponent(COUNT_KEY)}&value=0`;
        console.log('📡 Trying CREATE:', url);
        const resCreate = await fetchWithTimeout(url);
        console.log('📨 CREATE response:', resCreate.status, resCreate.statusText);
        
        if (resCreate.ok) {
            const data = await resCreate.json();
            globalClickCount = data.value || 0;
            globalCountAvailable = true;
            console.log('✅ Global counter created:', globalClickCount);
            updateDisplay();
            return;
        }
    } catch (error) {
        console.log('❌ CREATE failed:', error.message);
    }

    // Fallback to Pantry if CountAPI failed
    if (PANTRY_ID) {
        await initPantryCount();
    } else {
        console.log('🔧 No PANTRY_ID, using localStorage fallback');
        // Use localStorage as fallback
        try {
            const saved = localStorage.getItem('lizardGlobalCount');
            if (saved && parseInt(saved) > 0) {
                globalClickCount = parseInt(saved);
                console.log('✅ Loaded global count from localStorage:', globalClickCount);
            } else {
                // Start with a reasonable base number, not zero
                globalClickCount = 50000;
                localStorage.setItem('lizardGlobalCount', globalClickCount.toString());
                console.log('✅ Initialized global count with base value:', globalClickCount);
            }
            updateDisplay();
        } catch (error) {
            console.log('❌ localStorage fallback failed:', error);
            globalClickCount = 50000;
            console.log('✅ Using default fallback count:', globalClickCount);
            updateDisplay();
        }
    }
}

// Pantry fallback functions
async function initPantryCount() {
    if (!PANTRY_ID) return false;
    
    try {
        const res = await fetchWithTimeout(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${PANTRY_BASKET}`);
        if (res.ok) {
            const data = await res.json();
            globalClickCount = data.count || 0;
            globalCountAvailable = true;
            updateDisplay();
            return true;
        } else if (res.status === 404) {
            // Create new basket with reasonable initial count
            const initialCount = 50000;
            const createRes = await fetchWithTimeout(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${PANTRY_BASKET}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: initialCount })
            });
            if (createRes.ok) {
                globalClickCount = initialCount;
                globalCountAvailable = true;
                updateDisplay();
                return true;
            }
        }
    } catch (error) {
        console.log('Pantry init failed:', error);
        // Set default value instead of failing
        globalClickCount = 50000;
        updateDisplay();
        return true;
    }
    return false;
}

async function updatePantryCount(n = 1) {
    if (!PANTRY_ID || !globalCountAvailable) return false;
    
    try {
        const newCount = globalClickCount + n;
        const res = await fetchWithTimeout(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${PANTRY_BASKET}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: newCount })
        });
        if (res.ok) {
            globalClickCount = newCount;
            updateDisplay();
            return true;
        }
    } catch (error) {
        console.log('Pantry update failed:', error);
    }
    return false;
}

// Increment global counter by n and update UI
async function incrementGlobalCount(n = 1) {
    console.log('🔄 Incrementing global count by:', n);
    
    // Always increment the local counter first for immediate feedback
    globalClickCount += n;
    updateDisplay();
    
    // Try to sync with backend (but don't block the UI)
    try {
        // Use 'hit' endpoint which auto-creates and increments by 1
        const url = n === 1
            ? `${COUNT_API_BASE}/hit/${COUNT_NAMESPACE}/${COUNT_KEY}`
            : `${COUNT_API_BASE}/update/${COUNT_NAMESPACE}/${COUNT_KEY}?amount=${n}`;
        const res = await fetchWithTimeout(url, {}, 2000); // Shorter timeout
        if (res.ok) {
            const data = await res.json();
            // Sync with server value if available
            if (data.value && data.value > globalClickCount) {
                globalClickCount = data.value;
                updateDisplay();
            }
            console.log('✅ Global counter synced with server:', globalClickCount);
            return;
        }
        console.log('⚠️ Server sync failed, using local count');
    } catch (error) {
        console.log('⚠️ Server unreachable, using local count:', error.message);
    }
    
    // Try Pantry fallback (non-blocking)
    if (PANTRY_ID) {
        updatePantryCount(n).catch(err => {
            console.log('⚠️ Pantry sync failed:', err.message);
        });
    }
    
    // Always save to localStorage as backup
    try {
        localStorage.setItem('lizardGlobalCount', globalClickCount.toString());
        console.log('✅ Global counter saved to localStorage:', globalClickCount);
    } catch (error) {
        console.log('❌ localStorage save failed:', error);
    }
}

// Game Elements
const lizardButton = document.getElementById('lizardButton');
const clickCountDisplay = document.getElementById('clickCount');
const cpsCountDisplay = document.getElementById('cpsCount');
const currentCpsCountDisplay = document.getElementById('currentCpsCount');
const flyingLizardsContainer = document.getElementById('flyingLizards');

// Debug: Log element availability
console.log('🔍 Element check:');
console.log('- lizardButton:', !!lizardButton);
console.log('- clickCountDisplay:', !!clickCountDisplay);
console.log('- cpsCountDisplay:', !!cpsCountDisplay);
console.log('- currentCpsCountDisplay:', !!currentCpsCountDisplay);
console.log('- flyingLizardsContainer:', !!flyingLizardsContainer);

// Control buttons
const soundBtn = document.getElementById('soundBtn');
const testSoundBtn = document.getElementById('testSoundBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const shareBtn = document.getElementById('shareBtn');
const infoBtn = document.getElementById('infoBtn');

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        // a11y: manage expanded state for screen readers
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', function() {
            const expanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', String(!expanded));
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

// Optimized audio pool with better memory management (copied from reference website)
const audioPool = [];
const poolSize = 5; // Reduced pool size for better performance
let currentAudioIndex = 0;
let audioBuffer = null;
let audioContext = null;

// Initialize Web Audio API for better performance
function initializeAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Load audio buffer once for reuse
async function loadAudioBuffer() {
    if (audioBuffer) return audioBuffer;
    
    try {
        const audioCtx = initializeAudioContext();
        // Use stable URL to leverage browser cache
        const response = await fetch('/lizard.wav');
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        console.log('🦎 Successfully loaded lizard.wav audio buffer');
        return audioBuffer;
    } catch (error) {
        console.log('Failed to load audio buffer, falling back to HTML Audio:', error);
        return null;
    }
}

// Initialize fallback audio pool for HTML Audio API
function initializeAudio() {
    for (let i = 0; i < poolSize; i++) {
        // Stable URL to allow caching
        const audio = new Audio('/lizard.wav');
        audio.preload = 'auto';
        audio.volume = 1.0;
        
        // Handle audio load success
        audio.onloadeddata = () => {
            console.log(`🦎 Audio ${i} successfully loaded lizard.wav`);
        };
        
        // Handle audio load errors gracefully
        audio.onerror = () => {
            console.log(`Audio ${i} failed to load lizard.wav, will use Web Audio fallback`);
        };
        
        audioPool.push(audio);
    }
}

// Play sound function (exact copy from reference website)
async function playClickSound() {
    console.log('🦎 playClickSound called, soundEnabled:', soundEnabled);
    
    if (!soundEnabled) {
        console.log('Sound is disabled');
        return;
    }
    
    // Try Web Audio API first for better performance
    if (audioBuffer && audioContext) {
        try {
            console.log('🦎 Using Web Audio API');
            const audioCtx = audioContext;
            if (audioCtx.state === 'suspended') {
                console.log('🦎 Resuming suspended audio context');
                await audioCtx.resume();
            }
            
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
            console.log('🦎 Web Audio API sound played successfully');
            return;
        } catch (error) {
            console.log('Web Audio API failed, falling back to HTML Audio:', error);
        }
    } else {
        console.log('🦎 Web Audio not available, audioBuffer:', !!audioBuffer, 'audioContext:', !!audioContext);
    }
    
    // Fallback to HTML Audio API with optimized approach
    const audio = audioPool[currentAudioIndex];
    console.log('🦎 Using HTML Audio, index:', currentAudioIndex, 'audio element:', audio);
    
    if (!audio) {
        console.log('❌ No audio element available');
        playLizardVoice();
        return;
    }
    
    // Stop and reset current audio to prevent overlap issues
    if (!audio.paused) {
        audio.pause();
    }
    audio.currentTime = 0;
    
    // Simple play with minimal error handling to avoid promise stacking
    try {
        console.log('🦎 Attempting to play HTML Audio');
        await audio.play();
        console.log('🦎 HTML Audio played successfully');
    } catch (error) {
        console.log('❌ HTML Audio failed:', error);
        // Move to next audio instance if current one fails
        currentAudioIndex = (currentAudioIndex + 1) % poolSize;
        
        // If all audio instances fail, use Speech Synthesis as final fallback
        if (currentAudioIndex === 0) {
            console.log('All audio instances failed, using Speech Synthesis fallback');
            playLizardVoice();
        }
    }
    
    currentAudioIndex = (currentAudioIndex + 1) % poolSize;
}

// Speech Synthesis fallback for when audio file is not available
function playLizardVoice() {
    if (!window.speechSynthesis) {
        console.log('Speech synthesis not available');
        return;
    }
    
    try {
        // Cancel any current speech
        window.speechSynthesis.cancel();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance('Lizard');
        utterance.rate = 1.2;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Find English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        window.speechSynthesis.speak(utterance);
        console.log('🦎 Playing "Lizard" via Speech Synthesis');
    } catch (error) {
        console.log('Speech synthesis failed:', error);
    }
}


// Global test functions for debugging
window.testLizardSound = function() {
    console.log('🦎 Testing Lizard sound...');
    playClickSound();
};

window.checkAudioSupport = function() {
    console.log('Web Audio API support:', !!(window.AudioContext || window.webkitAudioContext));
    console.log('HTML Audio support:', !!window.Audio);
    console.log('Audio pool size:', audioPool.length);
    console.log('Audio buffer loaded:', !!audioBuffer);
    console.log('Sound enabled:', soundEnabled);
};

// Game Initialization
function initializeGame() {
    console.log('Initializing game...');
    console.log('lizardButton:', lizardButton);
    console.log('clickCountDisplay:', clickCountDisplay);
    console.log('cpsCountDisplay:', cpsCountDisplay);
    
    // Initialize audio system (copied from reference website)
    initializeAudio();
    
    // Load saved data
    loadGameData();

    // Initialize global counter
    initGlobalCount();
    
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
    
    if (testSoundBtn) {
        testSoundBtn.addEventListener('click', () => {
            console.log('Test sound button clicked');
            // Use main audio path; internal fallback will handle errors
            playClickSound();
        });
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
    // First click - enable audio and update info
    if (clickCount === 0) {
        const audioInfo = document.getElementById('audioInfo');
        if (audioInfo) {
            audioInfo.textContent = soundEnabled ? '🔊 "Lizard" voice enabled!' : '🔇 Voice disabled';
            setTimeout(() => {
                audioInfo.style.display = 'none';
            }, 3000);
        }
    }
    
    // Resume audio context if needed (for browser autoplay policy)
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Increment click count
    clickCount++;
    
    // Record timestamp for CPS and detailed log
    const now = Date.now();
    clicksInLastSecond.push(now);
    recordClickDetails(event, now);
    
    // Play click sound
    playClickSound();
    
    // 更新CPS与显示
    updateCPS();

    // Update global counter (all users)
    incrementGlobalCount(1);
    
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
    const oneSecondAgo = now - 1100; // Slightly longer window to account for timing variations
    
    // Remove clicks older than 1 second
    const oldLength = clicksInLastSecond.length;
    clicksInLastSecond = clicksInLastSecond.filter(time => time > oneSecondAgo);
    const newLength = clicksInLastSecond.length;
    
    // Update current CPS
    currentCPS = clicksInLastSecond.length;
    
    // Debug logging
    if (oldLength !== newLength) {
        console.log(`🕒 CPS Update: removed ${oldLength - newLength} old clicks, current CPS: ${currentCPS}`);
    }
    
    // 更新最高CPS记录
    if (currentCPS > maxCPS) {
        maxCPS = currentCPS;
        console.log(`🏆 新的CPS记录: ${maxCPS}`);
    }
    
    // Update display
    updateDisplay();
}

// Update display counters
function updateDisplay() {
    console.log('🔄 Updating display...');
    console.log('- clickCount:', clickCount);
    console.log('- currentCPS:', currentCPS);
    console.log('- globalClickCount:', globalClickCount);
    console.log('- globalCountAvailable:', globalCountAvailable);
    
    if (clickCountDisplay) {
        // Now shows "All Clicks" - display global count
        clickCountDisplay.textContent = Number(globalClickCount).toLocaleString();
        console.log('✅ Updated All Clicks (clickCountDisplay) to:', globalClickCount);
    } else {
        console.log('❌ clickCountDisplay not found');
    }
    
    if (cpsCountDisplay) {
        // Now shows "My Clicks" - display personal count
        cpsCountDisplay.textContent = clickCount;
        console.log('✅ Updated My Clicks (cpsCountDisplay) to:', clickCount);
        
        // 添加动画效果
        cpsCountDisplay.style.transform = 'scale(1.1)';
        cpsCountDisplay.style.color = '#FF9800';
        
        setTimeout(() => {
            cpsCountDisplay.style.transform = 'scale(1)';
        }, 150);
    } else {
        console.log('cpsCountDisplay not found');
    }

    if (currentCpsCountDisplay) {
        currentCpsCountDisplay.textContent = currentCPS;
        console.log('Updated current CPS to:', currentCPS);
        
        // 添加动画效果
        currentCpsCountDisplay.style.transform = 'scale(1.1)';
        currentCpsCountDisplay.style.color = '#4CAF50';
        
        setTimeout(() => {
            currentCpsCountDisplay.style.transform = 'scale(1)';
        }, 150);
    } else {
        console.log('currentCpsCountDisplay not found');
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

// FAQ sections are now permanently expanded for better SEO and user experience

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

// Parallax effect removed to keep hero section fixed

// Initialize audio system and preload files when page loads (copied from reference website)
window.addEventListener('load', async function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Initialize Web Audio API and load buffer
    try {
        await loadAudioBuffer();
        console.log('🦎 Web Audio API initialized successfully');
    } catch (error) {
        console.log('Web Audio initialization failed, using HTML Audio fallback');
    }
    
    // Preload HTML Audio fallback files
    audioPool.forEach(audio => {
        audio.load();
    });
    
    console.log('🦎 Audio system initialized with lizard.wav');
    
    // 在控制台提供一些有用的函数
    console.log(`
🦎 Lizard Click 调试工具已加载！

可用的控制台命令:
• getClickStats() - 获取详细统计信息
• exportClickData() - 导出点击数据
• clickHistory - 查看点击历史记录
• clearClickHistory() - 清除点击历史
• resetGame() - 重置游戏数据
• debugAllClicks() - 🔍 调试All Clicks问题
• testGlobalCounter() - 🌐 测试全局计数器

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
        
        localStorage.removeItem('lizardClickData');
        updateDisplay();
        
        console.log('🔄 游戏数据已重置');
        alert('游戏数据已重置！');
    }
};

// 全局函数：获取统计信息
window.getClickStats = getClickStats;
window.exportClickData = exportClickData;

// 专门的调试函数
window.debugAllClicks = function() {
    console.log('🔍 === All Clicks Debug Info ===');
    console.log('Elements:');
    console.log('- lizardButton:', !!lizardButton);
    console.log('- clickCountDisplay:', !!clickCountDisplay);
    console.log('- cpsCountDisplay:', !!cpsCountDisplay);
    console.log('- currentCpsCountDisplay:', !!currentCpsCountDisplay);
    
    console.log('Elements details:');
    if (cpsCountDisplay) {
        console.log('- cpsCountDisplay id:', cpsCountDisplay.id);
        console.log('- cpsCountDisplay class:', cpsCountDisplay.className);
        console.log('- cpsCountDisplay textContent:', cpsCountDisplay.textContent);
        console.log('- cpsCountDisplay innerHTML:', cpsCountDisplay.innerHTML);
        console.log('- cpsCountDisplay visible:', cpsCountDisplay.offsetParent !== null);
        console.log('- cpsCountDisplay styles:', window.getComputedStyle(cpsCountDisplay));
    }
    
    console.log('Counters:');
    console.log('- clickCount:', clickCount);
    console.log('- currentCPS:', currentCPS);
    console.log('- globalClickCount:', globalClickCount);
    console.log('- globalCountAvailable:', globalCountAvailable);
    
    console.log('Display values:');
    console.log('- clickCountDisplay.textContent:', clickCountDisplay ? clickCountDisplay.textContent : 'N/A');
    console.log('- cpsCountDisplay.textContent:', cpsCountDisplay ? cpsCountDisplay.textContent : 'N/A');
    console.log('- currentCpsCountDisplay.textContent:', currentCpsCountDisplay ? currentCpsCountDisplay.textContent : 'N/A');
    
    console.log('API Info:');
    console.log('- COUNT_API_BASE:', COUNT_API_BASE);
    console.log('- COUNT_NAMESPACE:', COUNT_NAMESPACE);
    console.log('- COUNT_KEY:', COUNT_KEY);
    
    console.log('DOM check:');
    console.log('- document.getElementById("cpsCount"):', document.getElementById('cpsCount'));
    console.log('- document.querySelector(".cps-value"):', document.querySelector('.cps-value'));
    
    console.log('=== End Debug Info ===');
};

// 测试全局计数器
window.testGlobalCounter = async function() {
    console.log('🌐 Testing Global Counter...');
    try {
        const url = `${COUNT_API_BASE}/get/${COUNT_NAMESPACE}/${COUNT_KEY}`;
        console.log('Testing URL:', url);
        const res = await fetchWithTimeout(url);
        console.log('Response status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Response data:', data);
        } else {
            console.log('Response error:', res.statusText);
        }
    } catch (error) {
        console.log('Fetch error:', error.message);
    }
};