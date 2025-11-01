const MIN_N = 12;
const MAX_N = 48;
let currentN = 24; // デフォルトは通常速度（1日が24時間）
let isSecondsVisible = true; // 秒数表示設定
let currentLang = 'ja'; // 言語設定

// ストップウォッチ関連の変数
let stopwatchStartTime = 0;
let stopwatchElapsedTime = 0;
let stopwatchTimer = null;
let lapTimes = [];

// ----------------------------------------------------
// 1. N値に基づいた時計の「速さ」調整ロジック (最終修正版)
// ----------------------------------------------------

function calculateNTime(realTime) {
    // 速度係数 = 24 / N
    // N=12 (12時間/日) => 24/12 = 2.0倍速
    // N=48 (48時間/日) => 24/48 = 0.5倍速
    const speedFactor = 24 / currentN; 
    
    // 調整後のミリ秒 = リアルタイムのミリ秒 * 速度係数
    const adjustedMilliseconds = realTime * speedFactor;
    
    // N時間表示に変換
    const adjustedDayLengthMs = currentN * 60 * 60 * 1000; // N時間の総ミリ秒
    const secondsIntoN = Math.floor((adjustedMilliseconds % adjustedDayLengthMs) / 1000);

    const h = Math.floor(secondsIntoN / 3600);
    const m = Math.floor((secondsIntoN % 3600) / 60);
    const s = Math.floor(secondsIntoN % 60);
    
    return { h: h, m: m, s: s };
}

function updateClock() {
    const now = new Date();
    // リアルタイムでの今日の開始からの経過ミリ秒
    const realTimeOfDay = now.getTime() - new Date(now.toDateString()).getTime(); 
    
    const { h, m, s } = calculateNTime(realTimeOfDay);
    
    const formattedH = String(h).padStart(2, '0');
    const formattedM = String(m).padStart(2, '0');
    const formattedS = String(s).padStart(2, '0');
    
    let timeString = `${formattedH}:${formattedM}`;
    if (isSecondsVisible) {
        timeString += `:${formattedS}`;
    }

    const clockDisplay = document.getElementById('n-clock-display');
    if (clockDisplay) {
        clockDisplay.textContent = timeString;
    }
    const nValueDisplay = document.getElementById('n-value-display');
    if (nValueDisplay) {
        nValueDisplay.textContent = `N = ${currentN} ${currentLang === 'ja' ? '時間' : 'Hours'}`;
    }
}

// ----------------------------------------------------
// 2. ストップウォッチ ロジック
// ----------------------------------------------------

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    const msRemainder = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    // ストップウォッチは hh:mm:ss.ms のフォーマット
    return `${h}:${m}:${s}.${msRemainder}`;
}

function updateStopwatch() {
    const now = Date.now();
    const elapsedTime = now - stopwatchStartTime + stopwatchElapsedTime;
    document.getElementById('stopwatch-display').textContent = formatTime(elapsedTime);
}

function startStopwatch() {
    if (!stopwatchTimer) {
        stopwatchStartTime = Date.now();
        stopwatchTimer = setInterval(updateStopwatch, 10); // 10ms ごとに更新
        document.getElementById('start-stop-btn').textContent = currentLang === 'ja' ? 'ストップ' : 'Stop';
        document.getElementById('start-stop-btn').classList.remove('start');
        document.getElementById('start-stop-btn').classList.add('stop');
        document.getElementById('lap-reset-btn').textContent = currentLang === 'ja' ? 'ラップ' : 'Lap';
        document.getElementById('lap-reset-btn').classList.remove('reset');
    } else {
        clearInterval(stopwatchTimer);
        stopwatchElapsedTime += Date.now() - stopwatchStartTime;
        stopwatchTimer = null;
        document.getElementById('start-stop-btn').textContent = currentLang === 'ja' ? 'スタート' : 'Start';
        document.getElementById('start-stop-btn').classList.remove('stop');
        document.getElementById('start-stop-btn').classList.add('start');
        document.getElementById('lap-reset-btn').textContent = currentLang === 'ja' ? 'リセット' : 'Reset';
        document.getElementById('lap-reset-btn').classList.add('reset');
    }
}

function lapOrResetStopwatch() {
    if (stopwatchTimer) { // ラップ (計測中)
        const lapTime = (Date.now() - stopwatchStartTime) + stopwatchElapsedTime;
        lapTimes.push(lapTime);
        renderLaps();
    } else if (stopwatchElapsedTime > 0) { // リセット (停止中で経過時間がある場合)
        stopwatchStartTime = 0;
        stopwatchElapsedTime = 0;
        lapTimes = [];
        document.getElementById('stopwatch-display').textContent = formatTime(0);
        document.getElementById('lap-reset-btn').textContent = currentLang === 'ja' ? 'ラップ' : 'Lap';
        document.getElementById('lap-reset-btn').classList.remove('reset');
        renderLaps();
    }
}

function renderLaps() {
    const lapsList = document.getElementById('lap-list');
    if (!lapsList) return;
    
    lapsList.innerHTML = '';
    
    // 最新のラップが上に来るように逆順に処理
    lapTimes.slice().reverse().forEach((lap, index) => {
        const li = document.createElement('li');
        // 表示するラップ番号は (総数 - 現在の逆順インデックス)
        const lapNumber = lapTimes.length - index; 
        li.textContent = `${currentLang === 'ja' ? 'ラップ' : 'Lap'} ${lapNumber}: ${formatTime(lap)}`;
        lapsList.appendChild(li); 
    });
}


// ----------------------------------------------------
// 3. モードのレンダリング関数
// ----------------------------------------------------

function renderClockMode() {
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? '時計' : 'Clock'}</div>
        <div id="n-clock-display" class="clock-display">--:--</div>
        
        <div class="control-panel">
            <label for="n-slider">1日の時間 (N)</label>
            <input type="range" id="n-slider" min="${MIN_N}" max="${MAX_N}" value="${currentN}" style="width: 100%; margin: 10px 0;">
            <div id="n-value-display" class="n-value-display" style="text-align: center;">N = ${currentN} ${currentLang === 'ja' ? '時間' : 'Hours'}</div>
        </div>
    `;
    setupNControl(); 
    updateClock();
}

function renderStopwatchMode() {
    // 既存の計測状態を維持しつつDOMを再構築
    const displayTime = formatTime(stopwatchElapsedTime + (stopwatchTimer ? Date.now() - stopwatchStartTime : 0));
    
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? 'ストップウォッチ' : 'Stopwatch'}</div>
        <div id="stopwatch-display" class="clock-display">${displayTime}</div>
        
        <div class="stopwatch-controls">
            <button id="lap-reset-btn" class="control-button gray-btn ${stopwatchTimer ? '' : (stopwatchElapsedTime > 0 ? 'reset' : '')}">
                ${stopwatchTimer ? (currentLang === 'ja' ? 'ラップ' : 'Lap') : (stopwatchElapsedTime > 0 ? (currentLang === 'ja' ? 'リセット' : 'Reset') : (currentLang === 'ja' ? 'ラップ' : 'Lap'))}
            </button>
            <button id="start-stop-btn" class="control-button ${stopwatchTimer ? 'stop' : (stopwatchElapsedTime > 0 ? 'start' : 'start')}">
                ${stopwatchTimer ? (currentLang === 'ja' ? 'ストップ' : 'Stop') : (currentLang === 'ja' ? 'スタート' : 'Start')}
            </button>
        </div>
        
        <ul id="lap-list" class="lap-list">
            </ul>
    `;
    
    // イベントリスナーの再設定
    document.getElementById('start-stop-btn').addEventListener('click', startStopwatch);
    document.getElementById('lap-reset-btn').addEventListener('click', lapOrResetStopwatch);
    
    renderLaps();
}

function renderAlarmMode() {
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? 'アラーム' : 'Alarm'}</div>
        <p style="text-align:center;">アラームの機能はこれから実装します。</p>
        `;
}

function renderSettingsMode() {
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? '設定' : 'Settings'}</div>
        <ul class="settings-list">
            <li>
                <span>${currentLang === 'ja' ? '秒数表示' : 'Show Seconds'}</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="seconds-toggle">
                    <span class="slider"></span>
                </label>
            </li>
            <li>
                <span>${currentLang === 'ja' ? '言語表示' : 'Language'}</span>
                <div class="segmented-control" id="language-control">
                    <button data-lang="ja" class="segment-button ${currentLang === 'ja' ? 'active' : ''}">${currentLang === 'ja' ? '日本語' : 'Japanese'}</button>
                    <button data-lang="en" class="segment-button ${currentLang === 'en' ? 'active' : ''}">${currentLang === 'ja' ? '英語' : 'English'}</button>
                </div>
            </li>
        </ul>
    `;
    setupSettings(); 
}


// ----------------------------------------------------
// 4. コントロール/イベントハンドラの設定
// ----------------------------------------------------

function setupNControl() {
    const slider = document.getElementById('n-slider');
    if (slider) {
        slider.min = MIN_N;
        slider.max = MAX_N;
        slider.value = currentN;

        slider.oninput = (e) => {
            currentN = parseInt(e.target.value);
            updateClock();
        };
    }
}

function setupSettings() {
    // A. 秒数表示トグルの設定
    const secondsToggle = document.getElementById('seconds-toggle');
    if (secondsToggle) {
        secondsToggle.checked = isSecondsVisible;
        secondsToggle.onchange = (e) => {
            isSecondsVisible = e.target.checked;
            updateClock(); 
        };
    }
    
    // B. 言語セグメントコントロールのイベント設定
    const langControl = document.getElementById('language-control');
    if (langControl) {
        langControl.querySelectorAll('.segment-button').forEach(button => {
            button.addEventListener('click', () => {
                langControl.querySelectorAll('.segment-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                currentLang = button.dataset.lang;
                
                // 言語が変わったので、現在のモードと時計を再レンダリング
                renderCurrentMode(); 
                updateClock();
            });
        });
    }
}

// 現在表示されているモードを再レンダリングするヘルパー関数
function renderCurrentMode() {
    const activeTab = document.querySelector('.tab-item.active');
    if (!activeTab) return;

    // 現在のモードの関数を呼び出す
    switch (activeTab.id) {
        case 'nav-clock':
            renderClockMode();
            break;
        case 'nav-stopwatch':
            renderStopwatchMode();
            break;
        case 'nav-alarm':
            renderAlarmMode();
            break;
        case 'nav-settings':
            renderSettingsMode();
            break;
    }
}

// 底部ナビゲーションの切り替え
function setupNavigation() {
    document.querySelectorAll('.tab-item').forEach(button => {
        button.addEventListener('click', (e) => {
            // アクティブクラスの切り替え
            document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // モードのレンダリング
            renderCurrentMode();
        });
    });
}


// ----------------------------------------------------
// 5. アプリの初期化
// ----------------------------------------------------

function initApp() {
    // 1秒ごとに時計を更新
    setInterval(updateClock, 1000); 
    
    // ナビゲーションと初期表示モードを設定
    setupNavigation();
    renderClockMode(); // アプリ起動時は時計モード
}

document.addEventListener('DOMContentLoaded', initApp);
