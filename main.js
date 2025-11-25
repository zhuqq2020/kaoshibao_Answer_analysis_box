// ==UserScript==
// @name         考试宝答案解析悬浮框
// @namespace    /
// @version      V0.1
// @description  2025-11-20更新
// @author       大聪明
// @match        *://*.zaixiankaoshi.com/*
// @grant       GM_addStyle
// @grant       GM_notification
// @license     MIT
// ==/UserScript==

(function() {
    'use strict';

    // 配置参数
    const CONFIG = {
        scanInterval: 5000, // 5秒扫描间隔
        notifyChanges: true // 检测到新内容时是否通知
    };

    // 添加全局样式
    GM_addStyle(`
        #aa-floating-panel {
            position: fixed;
            width: 650px;
            max-height: 65vh;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 2147483647;
            font-family: 'Segoe UI', system-ui, sans-serif;
            overflow: hidden;
            top: 600px;
            left: 55px;
            border: 1px solid #e0e0e0;
        }
        #aa-panel-header {
            padding: 14px 18px;
            background: linear-gradient(135deg, #4a6baf 0%, #3a5a9f 100%);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #aa-panel-title {
            font-weight: 600;
            font-size: 16px;
        }
        #aa-panel-date {
            font-size: 11px;
            opacity: 0.9;
            margin-top: 3px;
        }
        #aa-controls {
            display: flex;
            gap: 10px;
        }
        .aa-control-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .aa-control-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        .aa-control-btn svg {
            width: 14px;
            height: 14px;
        }
        #aa-content-container {
            padding: 16px;
            overflow-y: auto;
            max-height: calc(65vh - 70px);
        }
        .aa-answer-item {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #f0f0f0;
        }
        .aa-item-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        .aa-item-index {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            background: #4a6baf;
            color: white;
            font-weight: bold;
            border-radius: 50%;
            margin-right: 10px;
            font-size: 12px;
        }
        .aa-item-time {
            font-size: 11px;
            color: #666;
            margin-left: auto;
        }
        #aa-no-results {
            color: #888;
            text-align: center;
            padding: 30px 0;
        }
        #aa-scan-status {
            font-size: 11px;
            text-align: right;
            padding: 0 16px 10px;
            color: #666;
        }
    `);

    // SVG图标
    const REFRESH_ICON = `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
    const CLOSE_ICON = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

    // 状态变量
    let panelInstance = null;
    let scanTimer = null;
    let lastContentHash = '';
    let lastScanTime = null;

    // 主入口
    function init() {
        createPanel();
        startAutoScan();
        setupGlobalListener();
    }

    // 创建悬浮面板
    function createPanel() {
        if (panelInstance) return;

        const panel = document.createElement('div');
        panel.id  = 'aa-floating-panel';

        panel.innerHTML  = `
            <div id="aa-panel-header">
                <div>
                    <div id="aa-panel-title">
                        <span>答案分析追踪器</span>
                    </div>
                </div>
                <div id="aa-controls">
                    <button class="aa-control-btn" id="aa-refresh-btn" title="立即刷新">${REFRESH_ICON}</button>
                    <button class="aa-control-btn" id="aa-close-btn" title="关闭面板">${CLOSE_ICON}</button>
                </div>
            </div>
            <div id="aa-content-container">
                <div id="aa-no-results">正在扫描答案分析内容...</div>
            </div>
            <div id="aa-scan-status">正在初始化...</div>
        `;

        document.body.appendChild(panel);
        panelInstance = panel;

        // 事件绑定
        panel.querySelector('#aa-refresh-btn').addEventListener('click',  manualRefresh);
        panel.querySelector('#aa-close-btn').addEventListener('click',  () => {
            stopAutoScan();
            panel.remove();
            panelInstance = null;
        });

        // 初始扫描
        updateContent();
    }

    // 更新内容区域
    function updateContent() {
        if (!panelInstance) return;

        const answerElements = document.querySelectorAll('p.answer-analysis');
        const contentContainer = panelInstance.querySelector('#aa-content-container');
        const statusElement = panelInstance.querySelector('#aa-scan-status');

        // 生成内容哈希用于检测变化
        const currentHash = Array.from(answerElements).map(el  => el.textContent).join('  |');
        const contentChanged = currentHash !== lastContentHash;
        lastScanTime = new Date();

        // 更新状态栏
        statusElement.textContent  = `最后扫描: ${formatTime(lastScanTime)} | 总数: ${answerElements.length}`;

        // 如果内容未变化且不是手动刷新则跳过
        if (!contentChanged && lastContentHash) {
            return;
        }

        // 生成新内容
        contentContainer.innerHTML  = generateContentHTML(answerElements, lastScanTime);
        lastContentHash = currentHash;

        // 内容变化通知
        if (contentChanged && CONFIG.notifyChanges  && lastContentHash) {
            GM_notification({
                title: '检测到新分析内容',
                text: `发现 ${answerElements.length}  条答案分析`,
                timeout: 3000
            });
        }
    }

    // 生成内容HTML
    function generateContentHTML(elements, scanTime) {
        if (elements.length  === 0) {
            return '<div id="aa-no-results">未检测到答案分析内容<br><small>(class="answer-analysis"的p标签)</small></div>';
        }

        return Array.from(elements).map((el,  idx) => `
            <div class="aa-answer-item">
                <div class="aa-item-header">
                    <span class="aa-item-index">${idx + 1}</span>
                    <span class="aa-item-time">${formatTime(scanTime)}</span>
                </div>
                ${el.innerHTML  || el.textContent}
            </div>
        `).join('');
    }

    // 定时扫描功能
    function startAutoScan() {
        stopAutoScan();
        scanTimer = setInterval(() => {
            updateContent();
        }, CONFIG.scanInterval);
    }

    function stopAutoScan() {
        if (scanTimer) {
            clearInterval(scanTimer);
            scanTimer = null;
        }
    }

    // 手动刷新
    function manualRefresh() {
        if (!panelInstance) return;

        const refreshBtn = panelInstance.querySelector('#aa-refresh-btn');
        refreshBtn.style.transform  = 'rotate(360deg)';
        refreshBtn.style.transition  = 'transform 0.6s ease';

        setTimeout(() => {
            refreshBtn.style.transform  = '';
            updateContent();
        }, 600);
    }

    // 全局快捷键监听 (Alt+Shift+A)
    function setupGlobalListener() {
        document.addEventListener('keydown',  (e) => {
            if (e.altKey  && e.shiftKey  && e.key  === 'A') {
                if (panelInstance) {
                    panelInstance.remove();
                    panelInstance = null;
                    stopAutoScan();
                } else {
                    init();
                }
            }
        });
    }

    // 辅助函数
    function formatTime(date) {
        return date.toLocaleTimeString('zh-CN',  { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // 延迟初始化
    setTimeout(init, 1000);
})();
