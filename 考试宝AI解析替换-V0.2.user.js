// ==UserScript==
// @name         考试宝AI解析替换
// @namespace    /
// @version      V0.2
// @description  替换考试宝AI解析框内容，去除VIP限制
// @author       大聪明
// @match        *://*.kaoshibao.com/*
// @downloadURL  https://github.com/zjy9908/Answer_analysis_box/blob/main/main.js
// @updateURL    https://github.com/zjy9908/Answer_analysis_box/blob/main/main.js
// @grant       GM_addStyle
// @grant       GM_notification
// @license     MIT
// ==/UserScript==

(function() {
    'use strict';

    // 配置参数
    const CONFIG = {
        scanInterval: 2000, // 2秒扫描间隔，更快检测
        autoReplace: true, // 自动替换AI解析
        removeVipRestriction: true, // 移除VIP限制
        showFullContent: true // 显示完整内容
    };

    // 添加全局样式
    GM_addStyle(`
        /* 隐藏VIP限制元素 */
        .hide-ai-analysis,
        .analysis-mask,
        .check-all-btn-row {
            display: none !important;
        }

        /* 显示完整的解析内容 */
        .answer-analysis-row.hide-height {
            max-height: none !important;
            overflow: visible !important;
        }

        /* 移除遮罩 */
        .analysis-mask {
            display: none !important;
        }

        /* 美化解析内容样式 */
        p.answer-analysis {
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: #333 !important;
            margin: 8px 0 !important;
            padding: 12px !important;
            background-color: #f8f9fa !important;
            border-radius: 8px !important;
            border-left: 4px solid #4a6baf !important;
        }

        /* 增强原解析按钮样式 */
        .check-origin-text {
            cursor: pointer !important;
            color: #4a6baf !important;
            font-size: 13px !important;
            padding: 4px 8px !important;
            border: 1px solid #4a6baf !important;
            border-radius: 4px !important;
            transition: all 0.3s ease !important;
        }

        .check-origin-text:hover {
            background-color: #4a6baf !important;
            color: white !important;
        }

        /* 状态指示器 */
        .aa-replacement-status {
            font-size: 12px !important;
            color: #666 !important;
            padding: 4px 8px !important;
            background: #f0f0f0 !important;
            border-radius: 4px !important;
            margin-left: 10px !important;
            display: inline-block !important;
        }

        .aa-status-success {
            color: #52c41a !important;
            background: #f6ffed !important;
        }

        .aa-status-processing {
            color: #1890ff !important;
            background: #e6f7ff !important;
        }
    `);

    // 主入口
    function init() {
        console.log('考试宝AI解析替换脚本已启动');
        startAutoScan();
        setupMutationObserver();

        // 初始扫描
        setTimeout(processPage, 1000);
    }

    // 处理页面内容
    function processPage() {
        const aiAnalysisSection = document.querySelector('.mb16');
        if (!aiAnalysisSection) {
            console.log('未找到AI解析区域');
            return false;
        }

        // 移除VIP限制
        if (CONFIG.removeVipRestriction) {
            removeVipRestrictions(aiAnalysisSection);
        }

        // 检查是否有答案分析内容
        const answerAnalysis = document.querySelector('p.answer-analysis');
        if (answerAnalysis) {
            // 显示完整内容
            if (CONFIG.showFullContent) {
                showFullContent(aiAnalysisSection);
            }

            // 添加状态指示器
            addStatusIndicator(aiAnalysisSection);

            console.log('成功处理AI解析内容');
            return true;
        }

        return false;
    }

    // 移除VIP限制
    function removeVipRestrictions(container) {
        // 隐藏VIP限制元素
        const vipElements = container.querySelectorAll('.hide-ai-analysis, .analysis-mask, .check-all-btn-row');
        vipElements.forEach(el => {
            el.style.display = 'none';
        });

        // 移除高度限制
        const analysisRows = container.querySelectorAll('.answer-analysis-row.hide-height');
        analysisRows.forEach(row => {
            row.style.maxHeight = 'none';
            row.style.overflow = 'visible';
            row.classList.remove('hide-height');
        });
    }

    // 显示完整内容
    function showFullContent(container) {
        const answerAnalysis = container.querySelector('p.answer-analysis');
        if (!answerAnalysis) return;

        // 确保内容完全显示
        answerAnalysis.style.cssText = `
            max-height: none !important;
            overflow: visible !important;
            opacity: 1 !important;
            filter: none !important;
            user-select: text !important;
            -webkit-user-select: text !important;
        `;

        // 移除可能的内容截断
        const parentDiv = answerAnalysis.parentElement;
        if (parentDiv) {
            parentDiv.style.overflow = 'visible';
        }
    }

    // 添加状态指示器
    function addStatusIndicator(container) {
        const analysisTop = container.querySelector('.analysis-top');
        if (!analysisTop) return;

        // 移除可能存在的旧状态指示器
        const oldStatus = analysisTop.querySelector('.aa-replacement-status');
        if (oldStatus) {
            oldStatus.remove();
        }

        // 创建新的状态指示器
        const statusDiv = document.createElement('div');
        statusDiv.className = 'aa-replacement-status aa-status-success';
        statusDiv.innerHTML = '✓ 已解锁完整解析';
        statusDiv.style.marginLeft = '10px';

        analysisTop.appendChild(statusDiv);

        // 3秒后渐隐
        setTimeout(() => {
            statusDiv.style.opacity = '0.7';
            statusDiv.style.transition = 'opacity 0.5s ease';
        }, 3000);
    }

    // 设置突变观察器
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                // 检查是否有新节点添加或属性变化
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    const target = mutation.target;

                    // 如果涉及到AI解析相关元素，重新处理
                    if (target.classList &&
                        (target.classList.contains('answer-analysis-row') ||
                         target.classList.contains('mb16') ||
                         target.classList.contains('answer-analysis'))) {
                        shouldProcess = true;
                    }

                    // 检查新增节点
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // 元素节点
                                if (node.classList &&
                                    (node.classList.contains('answer-analysis-row') ||
                                     node.classList.contains('mb16') ||
                                     node.querySelector && node.querySelector('.answer-analysis'))) {
                                    shouldProcess = true;
                                }
                            }
                        });
                    }
                }
            });

            if (shouldProcess) {
                setTimeout(() => {
                    processPage();
                }, 500);
            }
        });

        // 开始观察整个文档
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    // 定时扫描功能
    function startAutoScan() {
        setInterval(() => {
            const hasContent = processPage();

            // 如果有变化，显示通知
            if (hasContent && CONFIG.autoReplace) {
                const statusIndicators = document.querySelectorAll('.aa-replacement-status');
                if (statusIndicators.length === 0) {
                    // 添加临时状态提示
                    const analysisTop = document.querySelector('.analysis-top');
                    if (analysisTop) {
                        const tempStatus = document.createElement('div');
                        tempStatus.className = 'aa-replacement-status aa-status-processing';
                        tempStatus.innerHTML = '🔄 正在更新解析...';
                        tempStatus.style.marginLeft = '10px';

                        analysisTop.appendChild(tempStatus);

                        setTimeout(() => {
                            tempStatus.remove();
                        }, 2000);
                    }
                }
            }
        }, CONFIG.scanInterval);
    }

    // 全局快捷键监听 (Alt+Shift+X 切换模式)
    function setupGlobalListener() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.shiftKey && e.key === 'X') {
                CONFIG.showFullContent = !CONFIG.showFullContent;
                processPage();

                GM_notification({
                    title: '解析模式切换',
                    text: CONFIG.showFullContent ? '已显示完整解析' : '已恢复原始显示',
                    timeout: 2000
                });
            }
        });
    }

    // 延迟初始化，等待页面加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 1500);
            setupGlobalListener();
        });
    } else {
        setTimeout(init, 1500);
        setupGlobalListener();
    }
})();