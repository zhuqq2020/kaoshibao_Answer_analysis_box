// ==UserScript==
// @name         考试宝AI解析美化增强版
// @namespace    /
// @version      V1.2
// @description  考试宝AI解析美化+智能快捷键+VIP破解+界面净化
// @author       zhuqq2020,大聪明
// @match        *://*.kaoshibao.com/*
// @downloadURL  https://github.com/zhuqq2020/kaoshibao_Answer_analysis_box/blob/main/main.js
// @updateURL    https://github.com/zhuqq2020/kaoshibao_Answer_analysis_box/blob/main/main.js
// @grant       GM_addStyle
// @grant       GM_notification
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @license     MIT
// ==/UserScript==

(function() {
    'use strict';

    // 获取网页默认字体大小
    function getDefaultFontSize() {
        // 获取页面主体文本的字体大小
        const bodyStyle = window.getComputedStyle(document.body);
        const bodyFontSize = parseFloat(bodyStyle.fontSize);
        
        // 获取考试宝解析的默认字体大小
        const defaultAnalysis = document.querySelector('p.answer-analysis');
        if (defaultAnalysis) {
            const style = window.getComputedStyle(defaultAnalysis);
            return parseFloat(style.fontSize);
        }
        
        // 如果找不到，返回常见的默认值或body字体大小
        return bodyFontSize || 14;
    }

    // 默认配置
    const DEFAULT_CONFIG = {
        // 基本功能
        autoReplace: true,
        removeVipRestriction: true,
        showFullContent: true,
        removeVipBox: true,
        scanInterval: 2000,
        
        // 智能快捷键功能
        smartEnter: true,          // 智能回车
        cleanUI: true,             // 界面净化
        scriptNav: true,           // 脚本翻页
        audioFeedback: false,      // 答题音效
        keyVisual: true,           // 按键视觉反馈
        
        // 快捷键映射
        keys: {
            submit: 'Enter',       // 提交答案
            prev: 'ArrowLeft',     // 上一题
            next: 'ArrowRight',    // 下一题
            forceUnlock: 'v',      // 强制解锁
            op_A: '1',            // 选项A
            op_B: '2',            // 选项B
            op_C: '3',            // 选项C
            op_D: '4',            // 选项D
            op_E: '5',            // 选项E
            op_F: '',             // 选项F
            op_G: '',             // 选项G
            op_H: '',             // 选项H
            op_I: '',             // 选项I
            op_J: '',             // 选项J
            op_K: '',             // 选项K
            op_L: '',             // 选项L
            op_M: '',             // 选项M
            op_N: '',             // 选项N
            op_O: '',             // 选项O
            op_P: '',             // 选项P
            op_Q: '',             // 选项Q
            op_R: '',             // 选项R
            op_S: '',             // 选项S
            op_T: '',             // 选项T
            op_U: '',             // 选项U
            op_V: '',             // 选项V
            op_W: '',             // 选项W
            op_X: '',             // 选项X
            op_Y: '',             // 选项Y
            op_Z: ''              // 选项Z
        },
        
        // 样式设置 - 使用网页默认字体大小
        fontSize: getDefaultFontSize(),
        lineHeight: 1.6,
        fontFamily: "inherit",     // 继承网页字体
        backgroundColor: '#f8f9fa',
        borderColor: '#4a6baf',
        textColor: '#333333',
        
        // 文字阴影设置
        textShadowEnabled: false,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowX: 0,
        textShadowY: 1,
        textShadowBlur: 2,
        
        // 解析框阴影设置
        boxShadowEnabled: true,
        boxShadowColor: 'rgba(0,0,0,0.1)',
        boxShadowX: 0,
        boxShadowY: 2,
        boxShadowBlur: 8,
        boxShadowSpread: 0,
        
        // 高级设置
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        
        // UI位置
        uiPos: { top: '', left: '' }
    };

    // 全局变量
    let userConfig = { ...DEFAULT_CONFIG };
    let settingsPanel = null;
    let settingsOverlay = null;
    let isProcessingSmartEnter = false; // 防止重复执行智能回车

    // 初始化配置
    function initConfig() {
        try {
            const savedConfig = GM_getValue('aa_config');
            if (savedConfig) {
                userConfig = { ...DEFAULT_CONFIG, ...savedConfig };
                // 确保keys对象完整
                userConfig.keys = { ...DEFAULT_CONFIG.keys, ...userConfig.keys };
                
                // 如果用户之前没有设置过字体大小，使用网页默认值
                if (!savedConfig.fontSize) {
                    userConfig.fontSize = getDefaultFontSize();
                }
            }
        } catch (e) {
            console.log('考试宝解析脚本：使用默认配置');
        }
    }

    // 保存配置
    function saveConfig() {
        try {
            GM_setValue('aa_config', userConfig);
            updateStyles();
            processPage();
            
            GM_notification({
                title: '考试宝解析',
                text: '设置已保存并应用',
                timeout: 2000
            });
        } catch (e) {
            console.log('保存配置失败:', e);
        }
    }

    // 静默保存配置
    function saveConfigSilent() {
        try {
            GM_setValue('aa_config', userConfig);
        } catch (e) {
            console.log('静默保存配置失败:', e);
        }
    }

    // 重置配置
    function resetConfig() {
        if (confirm('确定要恢复所有设置为默认值吗？')) {
            userConfig = { ...DEFAULT_CONFIG };
            // 重置时重新获取网页默认字体
            userConfig.fontSize = getDefaultFontSize();
            saveConfig();
            location.reload();
        }
    }

    // 更新样式 - 修复解析内容显示问题
    function updateStyles() {
        const styleId = 'aa-custom-styles';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        
        // 构建文字阴影字符串
        let textShadowValue = 'none';
        if (userConfig.textShadowEnabled) {
            textShadowValue = `${userConfig.textShadowX}px ${userConfig.textShadowY}px ${userConfig.textShadowBlur}px ${userConfig.textShadowColor}`;
        }
        
        // 构建解析框阴影字符串
        let boxShadowValue = 'none';
        if (userConfig.boxShadowEnabled) {
            boxShadowValue = `${userConfig.boxShadowX}px ${userConfig.boxShadowY}px ${userConfig.boxShadowBlur}px ${userConfig.boxShadowSpread}px ${userConfig.boxShadowColor}`;
        }
        
        // 字体设置 - 处理inherit特殊情况
        const fontSize = userConfig.fontSize;
        const fontFamily = userConfig.fontFamily === 'inherit' ? 'inherit' : `${userConfig.fontFamily} !important`;
        
        // 界面净化CSS
        const cleanUICSS = userConfig.cleanUI ? `
            /* 界面净化 - 隐藏干扰元素 */
            .header, .new-footer, .right-float-window, .advertisement, .ad-box,
            .breadcrumb, .lock-icon, .icon-vip, .vip-icon,
            .open-vip-btn, .vip-dialog, .pay-dialog,
            .mask-box, .blur-mask,
            .practice-footer, .navigation, .copyright,
            .banner, .promotion, .recommend,
            .sidebar, .side-bar, .side-nav,
            .bottom-toolbar, .float-btn, .popup-ad {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            /* 主内容区域优化 */
            .app-main { padding-top: 10px !important; }
            .practice-main { margin: 0 !important; padding: 0 !important; }
            .practice-content { margin: 0 !important; }
            
            /* 精简顶部 */
            .practice-header { min-height: 40px !important; padding: 10px !important; }
            .header-tools { margin-top: 5px !important; }
            
            /* 隐藏底部 */
            .practice-bottom, .footer-area { display: none !important; }
        ` : '';
        
        styleElement.textContent = `
            /* 隐藏VIP限制元素 */
            .hide-ai-analysis,
            .analysis-mask,
            .check-all-btn-row,
            .analysis-bottom,
            .lock-icon,
            .hide-ai-analysis-text {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            /* 删除VIP信息框 */
            .vip-quanyi {
                display: none !important;
            }
            
            /* 修复解析内容显示问题 - 强制显示完整内容 */
            .answer-analysis-row,
            .answer-analysis-row.hide-height,
            .hide-height {
                max-height: none !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
                -webkit-line-clamp: unset !important;
                line-clamp: unset !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 10 !important;
            }
            
            /* 移除所有遮罩层和模糊效果 */
            .analysis-mask,
            .blur-mask,
            .mask-box,
            .vip-mask,
            [class*="mask"],
            [class*="blur"],
            .overlay-mask,
            .blur-overlay {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                background: transparent !important;
                backdrop-filter: none !important;
                filter: none !important;
                height: 0 !important;
                width: 0 !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
            }
            
            /* 移除遮罩 */
            .analysis-mask {
                display: none !important;
            }
            
            /* 美化解析内容样式 - 强制显示完整内容 */
            p.answer-analysis,
            .answer-analysis,
            .answer-box-detail,
            .analysis-content {
                font-size: ${fontSize}px !important;
                line-height: ${userConfig.lineHeight} !important;
                font-family: ${fontFamily};
                color: ${userConfig.textColor} !important;
                margin: 8px 0 !important;
                padding: ${userConfig.padding}px !important;
                background-color: ${userConfig.backgroundColor} !important;
                border-radius: ${userConfig.borderRadius}px !important;
                border-left: ${userConfig.borderLeftWidth}px solid ${userConfig.borderColor} !important;
                box-shadow: ${boxShadowValue} !important;
                text-shadow: ${textShadowValue} !important;
                transition: all 0.3s ease !important;
                
                /* 强制显示完整内容 */
                max-height: none !important;
                height: auto !important;
                overflow: visible !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                filter: none !important;
                -webkit-text-fill-color: ${userConfig.textColor} !important;
                user-select: text !important;
                -webkit-user-select: text !important;
                
                /* 修复文本换行 */
                white-space: normal !important;
                word-wrap: break-word !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                text-overflow: unset !important;
                
                /* 移除可能的内容截断 */
                -webkit-line-clamp: unset !important;
                line-clamp: unset !important;
                
                /* 确保不会被遮挡 */
                position: relative !important;
                z-index: 20 !important;
            }
            
            /* 修复解析内容中的段落和文本 */
            .answer-analysis p,
            .answer-analysis span,
            .answer-analysis div,
            .answer-box-detail p,
            .answer-box-detail span,
            .answer-box-detail div,
            .analysis-content p,
            .analysis-content span,
            .analysis-content div {
                color: ${userConfig.textColor} !important;
                font-size: inherit !important;
                line-height: inherit !important;
                font-family: inherit !important;
                max-height: none !important;
                overflow: visible !important;
                opacity: 1 !important;
                filter: none !important;
                -webkit-text-fill-color: ${userConfig.textColor} !important;
                white-space: normal !important;
                word-wrap: break-word !important;
            }
            
            /* 增强原解析按钮样式 */
            .check-origin-text {
                cursor: pointer !important;
                color: ${userConfig.borderColor} !important;
                font-size: 13px !important;
                padding: 4px 8px !important;
                border: 1px solid ${userConfig.borderColor} !important;
                border-radius: 4px !important;
                transition: all 0.3s ease !important;
            }
            
            .check-origin-text:hover {
                background-color: ${userConfig.borderColor} !important;
                color: white !important;
            }
            
            /* 修复父容器 */
            .answer-box,
            .analysis-wrapper,
            .mb16 > div,
            .mb16 .answer-analysis-row {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                position: relative !important;
            }
            
            /* 确保所有可能遮挡的元素都被移除 */
            .answer-analysis:before,
            .answer-analysis:after,
            .answer-analysis-row:before,
            .answer-analysis-row:after,
            .answer-box-detail:before,
            .answer-box-detail:after {
                display: none !important;
                content: none !important;
            }
            
            ${cleanUICSS}
            
            /* 设置面板样式 */
            #aa-settings-panel {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 520px !important;
                max-height: 85vh !important;
                background: white !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.25) !important;
                z-index: 10000 !important;
                font-family: 'Segoe UI', sans-serif !important;
                overflow: hidden !important;
                border: 2px solid ${userConfig.borderColor} !important;
                display: none !important;
            }
            
            #aa-settings-panel.active {
                display: block !important;
            }
            
            .aa-settings-header {
                padding: 18px 20px !important;
                background: linear-gradient(135deg, ${userConfig.borderColor} 0%, #3a5a9f 100%) !important;
                color: white !important;
                font-weight: 600 !important;
                font-size: 18px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                cursor: move !important;
                user-select: none !important;
            }
            
            .aa-settings-content {
                padding: 20px !important;
                max-height: calc(85vh - 70px) !important;
                overflow-y: auto !important;
                background: #fafafa !important;
            }
            
            .aa-settings-group {
                margin-bottom: 20px !important;
                background: white !important;
                padding: 15px !important;
                border-radius: 8px !important;
                border: 1px solid #eee !important;
            }
            
            .aa-settings-title {
                font-weight: 600 !important;
                margin-bottom: 12px !important;
                color: #333 !important;
                font-size: 15px !important;
                padding-bottom: 8px !important;
                border-bottom: 2px solid ${userConfig.borderColor} !important;
            }
            
            .aa-setting-item {
                margin-bottom: 15px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
            }
            
            .aa-setting-label {
                font-size: 14px !important;
                color: #555 !important;
                flex: 1 !important;
                margin-right: 15px !important;
            }
            
            .aa-setting-input {
                width: 80px !important;
                padding: 8px 10px !important;
                border: 1px solid #ddd !important;
                border-radius: 6px !important;
                font-size: 14px !important;
                box-sizing: border-box !important;
                background: white !important;
                transition: border 0.3s !important;
                text-align: center !important;
                font-weight: bold !important;
            }
            
            .aa-setting-input:focus {
                border-color: ${userConfig.borderColor} !important;
                outline: none !important;
                box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.1) !important;
            }
            
            .aa-setting-input-long {
                width: 120px !important;
                padding: 8px 10px !important;
                border: 1px solid #ddd !important;
                border-radius: 6px !important;
                font-size: 14px !important;
                box-sizing: border-box !important;
                background: white !important;
                transition: border 0.3s !important;
            }
            
            .aa-setting-input-long:focus {
                border-color: ${userConfig.borderColor} !important;
                outline: none !important;
                box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.1) !important;
            }
            
            .aa-setting-color {
                width: 40px !important;
                height: 35px !important;
                border: 2px solid #ddd !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                padding: 0 !important;
                transition: border 0.3s !important;
            }
            
            .aa-setting-color:hover {
                border-color: ${userConfig.borderColor} !important;
            }
            
            .aa-setting-switch {
                width: 50px !important;
                height: 24px !important;
                background: #ccc !important;
                border-radius: 12px !important;
                position: relative !important;
                cursor: pointer !important;
                transition: background 0.3s !important;
                flex-shrink: 0 !important;
                border: 1px solid #bbb !important;
            }
            
            .aa-setting-switch.active {
                background: ${userConfig.borderColor} !important;
                border-color: ${userConfig.borderColor} !important;
            }
            
            .aa-setting-switch::after {
                content: '' !important;
                position: absolute !important;
                top: 2px !important;
                left: 2px !important;
                width: 18px !important;
                height: 18px !important;
                background: white !important;
                border-radius: 50% !important;
                transition: transform 0.3s !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            }
            
            .aa-setting-switch.active::after {
                transform: translateX(26px) !important;
            }
            
            .aa-settings-buttons {
                display: flex !important;
                gap: 12px !important;
                margin-top: 25px !important;
                padding-top: 15px !important;
                border-top: 1px solid #eee !important;
            }
            
            .aa-settings-btn {
                flex: 1 !important;
                padding: 12px !important;
                border: none !important;
                border-radius: 8px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.3s !important;
                font-size: 14px !important;
                text-align: center !important;
            }
            
            .aa-settings-save {
                background: ${userConfig.borderColor} !important;
                color: white !important;
            }
            
            .aa-settings-save:hover {
                background: #3a5a9f !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 8px rgba(58, 90, 159, 0.3) !important;
            }
            
            .aa-settings-reset {
                background: #f0f0f0 !important;
                color: #666 !important;
                border: 1px solid #ddd !important;
            }
            
            .aa-settings-reset:hover {
                background: #e0e0e0 !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
            }
            
            /* 状态指示器 */
            .aa-replacement-status {
                font-size: 12px !important;
                color: #666 !important;
                padding: 6px 10px !important;
                background: #f0f0f0 !important;
                border-radius: 6px !important;
                margin-left: 10px !important;
                display: inline-block !important;
            }
            
            .aa-status-success {
                color: #52c41a !important;
                background: #f6ffed !important;
            }
            
            /* 设置按钮 */
            #aa-settings-trigger {
                position: fixed !important;
                bottom: 100px !important;
                right: 30px !important;
                width: 60px !important;
                height: 60px !important;
                background: ${userConfig.borderColor} !important;
                color: white !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                box-shadow: 0 6px 20px rgba(74, 107, 175, 0.4) !important;
                z-index: 9999 !important;
                font-size: 28px !important;
                transition: all 0.3s ease !important;
                border: none !important;
                user-select: none !important;
            }
            
            #aa-settings-trigger:hover {
                transform: scale(1.15) rotate(15deg) !important;
                box-shadow: 0 8px 25px rgba(74, 107, 175, 0.5) !important;
            }
            
            #aa-settings-trigger:active {
                transform: scale(1.05) !important;
            }
            
            /* 遮罩层 */
            .aa-settings-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0,0,0,0.6) !important;
                z-index: 9998 !important;
                display: none !important;
                backdrop-filter: blur(3px) !important;
            }
            
            .aa-settings-overlay.active {
                display: block !important;
            }
            
            /* 关闭按钮 */
            #aa-settings-close {
                background: none !important;
                border: none !important;
                color: white !important;
                cursor: pointer !important;
                font-size: 28px !important;
                line-height: 1 !important;
                padding: 0 !important;
                width: 30px !important;
                height: 30px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: transform 0.3s !important;
            }
            
            #aa-settings-close:hover {
                transform: scale(1.2) rotate(90deg) !important;
            }
            
            /* 按键视觉反馈 */
            .aa-key-indicator {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                font-size: 80px !important;
                font-weight: bold !important;
                color: rgba(64, 158, 255, 0.8) !important;
                z-index: 99999 !important;
                pointer-events: none !important;
                text-shadow: 0 0 20px rgba(255,255,255,0.8) !important;
                opacity: 0 !important;
                transition: all 0.4s ease !important;
            }
            
            /* 快捷键提示 */
            .aa-shortcut-hint {
                position: fixed !important;
                bottom: 170px !important;
                right: 30px !important;
                background: rgba(255,255,255,0.95) !important;
                border: 1px solid ${userConfig.borderColor} !important;
                border-radius: 8px !important;
                padding: 12px 15px !important;
                font-size: 12px !important;
                color: #666 !important;
                z-index: 9997 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                max-width: 300px !important;
            }
            
            .aa-hint-title {
                font-weight: bold !important;
                color: ${userConfig.borderColor} !important;
                margin-bottom: 5px !important;
                font-size: 13px !important;
            }
            
            .aa-hint-item {
                display: flex !important;
                justify-content: space-between !important;
                margin-bottom: 3px !important;
            }
            
            /* 按键冲突警告 */
            .aa-conflict-warning {
                color: #f56c6c !important;
                font-size: 12px !important;
                margin-top: 5px !important;
                padding: 5px 10px !important;
                background: #fef0f0 !important;
                border-radius: 4px !important;
                display: none !important;
            }
        `;
    }

    // 按键视觉反馈
    function showKeyIndicator(text) {
        if (!userConfig.keyVisual) return;
        
        let div = document.getElementById('aa-key-indicator');
        if (div) div.remove();
        
        div = document.createElement('div');
        div.id = 'aa-key-indicator';
        div.className = 'aa-key-indicator';
        div.textContent = text;
        document.body.appendChild(div);
        
        requestAnimationFrame(() => {
            div.style.opacity = '1';
            div.style.transform = 'translate(-50%, -50%) scale(1.2)';
        });
        
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => div.remove(), 400);
        }, 300);
    }

    // 显示快捷键提示
    function showShortcutHint() {
        let hint = document.getElementById('aa-shortcut-hint');
        if (hint) hint.remove();
        
        hint = document.createElement('div');
        hint.id = 'aa-shortcut-hint';
        hint.className = 'aa-shortcut-hint';
        hint.innerHTML = `
            <div class="aa-hint-title">🎮 快捷键提示</div>
            <div class="aa-hint-item"><span>${userConfig.keys.submit || 'Enter'}</span><span>智能提交/下一题</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.prev || '←'}</span><span>上一题</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.next || '→'}</span><span>下一题</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.op_A || '1'}</span><span>选项 A</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.op_B || '2'}</span><span>选项 B</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.op_C || '3'}</span><span>选项 C</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.op_D || '4'}</span><span>选项 D</span></div>
            <div class="aa-hint-item"><span>${userConfig.keys.op_E || '5'}</span><span>选项 E</span></div>
        `;
        
        document.body.appendChild(hint);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (hint.parentNode) hint.remove();
            }, 500);
        }, 3000);
    }

    // DOM辅助函数 - 修复版
    function clickByText(text, exact = false) {
        try {
            // 方法1：使用XPath查找元素
            let xpath;
            if (exact) {
                xpath = `//*[text()='${text}']`;
            } else {
                xpath = `//*[contains(text(), '${text}')]`;
            }
            
            const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            // 优先查找可见的按钮元素
            for (let i = 0; i < result.snapshotLength; i++) {
                const el = result.snapshotItem(i);
                // 检查元素是否可见且可点击
                if (el.offsetParent !== null && 
                    el.getBoundingClientRect().width > 0 && 
                    el.getBoundingClientRect().height > 0) {
                    // 检查是否是按钮或可点击元素
                    if (el.tagName === 'BUTTON' || 
                        el.tagName === 'A' || 
                        el.getAttribute('onclick') || 
                        el.classList.contains('el-button') ||
                        el.classList.contains('btn') ||
                        el.parentElement.tagName === 'BUTTON') {
                        el.click();
                        console.log(`点击了元素: ${text}`);
                        return true;
                    }
                }
            }
            
            // 方法2：查找包含文本的任何可见元素
            for (let i = 0; i < result.snapshotLength; i++) {
                const el = result.snapshotItem(i);
                if (el.offsetParent !== null && 
                    el.getBoundingClientRect().width > 0 && 
                    el.getBoundingClientRect().height > 0) {
                    el.click();
                    console.log(`点击了元素: ${text}`);
                    return true;
                }
            }
            
            // 方法3：使用querySelector查找
            const elements = document.querySelectorAll('button, a, div, span');
            for (const el of elements) {
                if (el.textContent.includes(text) && 
                    el.offsetParent !== null &&
                    el.getBoundingClientRect().width > 0) {
                    el.click();
                    console.log(`点击了元素: ${text}`);
                    return true;
                }
            }
            
            return false;
        } catch (e) {
            console.error('点击元素时出错:', e);
            return false;
        }
    }

    function selectOption(char) {
        // 尝试匹配选项
        if (clickByText(char, true)) return true;
        if (clickByText(`${char}.`)) return true;
        if (clickByText(`${char} `)) return true;
        
        // 查找选项元素
        const options = document.querySelectorAll('.option, .el-radio, .el-checkbox, .answer-item');
        for (const option of options) {
            if (option.textContent.trim().startsWith(char) || 
                option.textContent.trim().startsWith(`${char}.`) ||
                option.textContent.trim().startsWith(`${char} `)) {
                option.click();
                return true;
            }
        }
        
        return false;
    }

    // 智能回车功能 - 修复版
    function smartEnterAction() {
        if (isProcessingSmartEnter) {
            console.log('智能回车正在处理中，跳过');
            return true;
        }
        
        console.log('执行智能回车操作');
        isProcessingSmartEnter = true;
        
        // 1. 先检查是否可以提交答案
        if (clickByText('提交答案')) {
            console.log('已点击"提交答案"');
            showKeyIndicator('✅ 提交');
            
            // 提交后等待页面加载完成
            const checkNextButton = setInterval(() => {
                // 检查"下一题"按钮是否出现
                const nextButton = document.querySelector('button:contains("下一题"), a:contains("下一题"), div:contains("下一题")');
                if (nextButton && nextButton.offsetParent !== null) {
                    clearInterval(checkNextButton);
                    console.log('"下一题"按钮已出现');
                    
                    // 等待一小段时间确保页面完全加载
                    setTimeout(() => {
                        // 点击下一题
                        if (clickByText('下一题')) {
                            console.log('已点击"下一题"');
                            showKeyIndicator('⏭️ 下一题');
                        } else {
                            // 如果没有下一题，尝试交卷
                            clickByText('交卷');
                            console.log('已点击"交卷"');
                            showKeyIndicator('📤 交卷');
                        }
                        isProcessingSmartEnter = false;
                    }, 500);
                }
            }, 300);
            
            // 最多等待5秒
            setTimeout(() => {
                clearInterval(checkNextButton);
                isProcessingSmartEnter = false;
                console.log('等待下一题按钮超时');
            }, 5000);
            
            return true;
        }
        
        // 2. 如果已经提交，直接下一题
        if (clickByText('下一题')) {
            console.log('已点击"下一题"');
            showKeyIndicator('⏭️ 下一题');
            isProcessingSmartEnter = false;
            return true;
        }
        
        // 3. 如果已经是最后一题，交卷
        if (clickByText('交卷')) {
            console.log('已点击"交卷"');
            showKeyIndicator('📤 交卷');
            isProcessingSmartEnter = false;
            return true;
        }
        
        console.log('没有找到可操作的元素');
        isProcessingSmartEnter = false;
        return false;
    }

    // 创建设置面板
    function createSettingsPanel() {
        console.log('创建设置面板...');
        
        // 创建遮罩层
        if (!settingsOverlay) {
            settingsOverlay = document.createElement('div');
            settingsOverlay.className = 'aa-settings-overlay';
            settingsOverlay.addEventListener('click', closeSettingsPanel);
            document.body.appendChild(settingsOverlay);
        }
        
        // 如果面板已存在，只显示它
        if (settingsPanel) {
            settingsPanel.classList.add('active');
            settingsOverlay.classList.add('active');
            return;
        }
        
        // 创建新面板
        settingsPanel = document.createElement('div');
        settingsPanel.id = 'aa-settings-panel';
        settingsPanel.className = 'active';
        
        // 生成选项快捷键的HTML
        let optionKeysHTML = '';
        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(65 + i);
            const keyId = `op_${char}`;
            const keyValue = userConfig.keys[keyId] || '';
            optionKeysHTML += `
                <div class="aa-setting-item">
                    <span class="aa-setting-label">选项 ${char}</span>
                    <input type="text" class="aa-setting-input" id="key-${keyId}" value="${keyValue}" readonly>
                </div>
            `;
        }
        
        settingsPanel.innerHTML = `
            <div class="aa-settings-header" id="aa-settings-header">
                <span>⚡ 考试宝解析增强设置 V1.3</span>
                <button id="aa-settings-close">×</button>
            </div>
            <div class="aa-settings-content">
                <div class="aa-settings-group">
                    <div class="aa-settings-title">🧠 智能快捷键</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">智能回车 (一键提交→下一题→交卷)</span>
                        <div class="aa-setting-switch ${userConfig.smartEnter ? 'active' : ''}" data-setting="smartEnter"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">界面净化 (去除广告侧边栏等)</span>
                        <div class="aa-setting-switch ${userConfig.cleanUI ? 'active' : ''}" data-setting="cleanUI"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">脚本翻页 (←/→ 方向键翻页)</span>
                        <div class="aa-setting-switch ${userConfig.scriptNav ? 'active' : ''}" data-setting="scriptNav"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">按键视觉反馈</span>
                        <div class="aa-setting-switch ${userConfig.keyVisual ? 'active' : ''}" data-setting="keyVisual"></div>
                    </div>
                </div>
                
                <div class="aa-settings-group">
                    <div class="aa-settings-title">🔓 解析美化</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">自动解锁VIP限制</span>
                        <div class="aa-setting-switch ${userConfig.removeVipRestriction ? 'active' : ''}" data-setting="removeVipRestriction"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">删除VIP推广信息框</span>
                        <div class="aa-setting-switch ${userConfig.removeVipBox ? 'active' : ''}" data-setting="removeVipBox"></div>
                    </div>
                </div>
                
                <div class="aa-settings-group">
                    <div class="aa-settings-title">📝 字体设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">字体大小 (px)</span>
                        <input type="number" class="aa-setting-input" id="fontSize" 
                               value="${userConfig.fontSize}" min="10" max="24" step="1">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">行高</span>
                        <input type="number" class="aa-setting-input" id="lineHeight" 
                               value="${userConfig.lineHeight}" step="0.1" min="1.2" max="2.5">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">字体</span>
                        <select class="aa-setting-input-long" id="fontFamily">
                            <option value="inherit" ${userConfig.fontFamily === 'inherit' ? 'selected' : ''}>继承网页字体</option>
                            <option value="'Microsoft YaHei', 'Segoe UI', sans-serif" ${userConfig.fontFamily.includes('Microsoft YaHei') ? 'selected' : ''}>微软雅黑</option>
                            <option value="'SimSun', serif" ${userConfig.fontFamily.includes('SimSun') ? 'selected' : ''}>宋体</option>
                            <option value="'SimHei', sans-serif" ${userConfig.fontFamily.includes('SimHei') ? 'selected' : ''}>黑体</option>
                            <option value="'PingFang SC', 'Hiragino Sans GB', sans-serif" ${userConfig.fontFamily.includes('PingFang') ? 'selected' : ''}>苹方</option>
                            <option value="'Arial', sans-serif" ${userConfig.fontFamily.includes('Arial') ? 'selected' : ''}>Arial</option>
                            <option value="'Courier New', monospace" ${userConfig.fontFamily.includes('Courier') ? 'selected' : ''}>等宽字体</option>
                        </select>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">启用文字阴影</span>
                        <div class="aa-setting-switch ${userConfig.textShadowEnabled ? 'active' : ''}" data-setting="textShadowEnabled"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">启用解析框阴影</span>
                        <div class="aa-setting-switch ${userConfig.boxShadowEnabled ? 'active' : ''}" data-setting="boxShadowEnabled"></div>
                    </div>
                </div>
                
                <div class="aa-settings-group">
                    <div class="aa-settings-title">🎨 颜色设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">背景颜色</span>
                        <input type="color" class="aa-setting-color" id="backgroundColor" 
                               value="${userConfig.backgroundColor}">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">边框颜色</span>
                        <input type="color" class="aa-setting-color" id="borderColor" 
                               value="${userConfig.borderColor}">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">文字颜色</span>
                        <input type="color" class="aa-setting-color" id="textColor" 
                               value="${userConfig.textColor}">
                    </div>
                </div>
                
                <div class="aa-settings-group">
                    <div class="aa-settings-title">🎹 全局快捷键</div>
                    <div id="aa-conflict-warning" class="aa-conflict-warning"></div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">提交/确认</span>
                        <input type="text" class="aa-setting-input" id="key-submit" value="${userConfig.keys.submit || ''}" readonly>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">上一题</span>
                        <input type="text" class="aa-setting-input" id="key-prev" value="${userConfig.keys.prev || ''}" readonly>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">下一题</span>
                        <input type="text" class="aa-setting-input" id="key-next" value="${userConfig.keys.next || ''}" readonly>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">强制解锁解析</span>
                        <input type="text" class="aa-setting-input" id="key-forceUnlock" value="${userConfig.keys.forceUnlock || ''}" readonly>
                    </div>
                </div>
                
                <div class="aa-settings-group">
                    <div class="aa-settings-title">🎮 选项快捷键 (A-Z)</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${optionKeysHTML}
                    </div>
                </div>
                
                <div class="aa-settings-group">
                    <div class="aa-settings-title">⚙️ 高级设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">圆角大小</span>
                        <input type="number" class="aa-setting-input" id="borderRadius" 
                               value="${userConfig.borderRadius}" min="0" max="20">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">内边距</span>
                        <input type="number" class="aa-setting-input" id="padding" 
                               value="${userConfig.padding}" min="5" max="30">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">边框宽度</span>
                        <input type="number" class="aa-setting-input" id="borderLeftWidth" 
                               value="${userConfig.borderLeftWidth}" min="1" max="10">
                    </div>
                </div>
                
                <div class="aa-settings-buttons">
                    <button class="aa-settings-btn aa-settings-reset" id="aa-settings-reset">🔄 恢复默认</button>
                    <button class="aa-settings-btn aa-settings-save" id="aa-settings-save">💾 保存设置</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsPanel);
        
        // 绑定事件
        bindSettingsEvents();
        
        // 显示遮罩
        settingsOverlay.classList.add('active');
        
        console.log('设置面板已创建并显示');
    }

    // 绑定设置面板事件
    function bindSettingsEvents() {
        if (!settingsPanel) return;
        
        // 关闭按钮
        const closeBtn = settingsPanel.querySelector('#aa-settings-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeSettingsPanel();
            });
        }
        
        // 开关切换
        settingsPanel.querySelectorAll('.aa-setting-switch').forEach(switchEl => {
            switchEl.addEventListener('click', function(e) {
                e.stopPropagation();
                const settingName = this.dataset.setting;
                if (settingName) {
                    userConfig[settingName] = !userConfig[settingName];
                    this.classList.toggle('active');
                }
            });
        });
        
        // 保存按钮
        const saveBtn = settingsPanel.querySelector('#aa-settings-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                saveSettings();
            });
        }
        
        // 重置按钮
        const resetBtn = settingsPanel.querySelector('#aa-settings-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                resetConfig();
            });
        }
        
        // 字体设置输入框
        const fontSizeInput = settingsPanel.querySelector('#fontSize');
        const lineHeightInput = settingsPanel.querySelector('#lineHeight');
        const fontFamilyInput = settingsPanel.querySelector('#fontFamily');
        const backgroundColorInput = settingsPanel.querySelector('#backgroundColor');
        const borderColorInput = settingsPanel.querySelector('#borderColor');
        const textColorInput = settingsPanel.querySelector('#textColor');
        const borderRadiusInput = settingsPanel.querySelector('#borderRadius');
        const paddingInput = settingsPanel.querySelector('#padding');
        const borderLeftWidthInput = settingsPanel.querySelector('#borderLeftWidth');
        
        if (fontSizeInput) {
            fontSizeInput.addEventListener('change', function() {
                userConfig.fontSize = parseFloat(this.value) || DEFAULT_CONFIG.fontSize;
            });
        }
        
        if (lineHeightInput) {
            lineHeightInput.addEventListener('change', function() {
                userConfig.lineHeight = parseFloat(this.value) || DEFAULT_CONFIG.lineHeight;
            });
        }
        
        if (fontFamilyInput) {
            fontFamilyInput.addEventListener('change', function() {
                userConfig.fontFamily = this.value;
            });
        }
        
        if (backgroundColorInput) {
            backgroundColorInput.addEventListener('change', function() {
                userConfig.backgroundColor = this.value;
            });
        }
        
        if (borderColorInput) {
            borderColorInput.addEventListener('change', function() {
                userConfig.borderColor = this.value;
            });
        }
        
        if (textColorInput) {
            textColorInput.addEventListener('change', function() {
                userConfig.textColor = this.value;
            });
        }
        
        if (borderRadiusInput) {
            borderRadiusInput.addEventListener('change', function() {
                userConfig.borderRadius = parseInt(this.value) || DEFAULT_CONFIG.borderRadius;
            });
        }
        
        if (paddingInput) {
            paddingInput.addEventListener('change', function() {
                userConfig.padding = parseInt(this.value) || DEFAULT_CONFIG.padding;
            });
        }
        
        if (borderLeftWidthInput) {
            borderLeftWidthInput.addEventListener('change', function() {
                userConfig.borderLeftWidth = parseInt(this.value) || DEFAULT_CONFIG.borderLeftWidth;
            });
        }
        
        // 按键输入处理
        settingsPanel.querySelectorAll('.aa-setting-input[readonly]').forEach(inp => {
            inp.onfocus = () => {
                inp.style.borderColor = userConfig.borderColor;
                inp.value = '按下按键...';
            };
            
            inp.onblur = () => {
                inp.style.borderColor = '#ddd';
                const keyId = inp.id.replace('key-', '');
                inp.value = userConfig.keys[keyId] || '';
            };
            
            inp.onkeydown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                let key = '';
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    key = '';
                } else if (e.key === ' ') {
                    key = 'Space';
                } else if (e.key === 'ArrowLeft') {
                    key = 'ArrowLeft';
                } else if (e.key === 'ArrowRight') {
                    key = 'ArrowRight';
                } else if (e.key === 'ArrowUp') {
                    key = 'ArrowUp';
                } else if (e.key === 'ArrowDown') {
                    key = 'ArrowDown';
                } else if (e.key === 'Enter') {
                    key = 'Enter';
                } else if (e.key === 'Escape') {
                    key = 'Escape';
                } else if (e.key === 'Tab') {
                    key = 'Tab';
                } else if (e.key.length === 1) {
                    key = e.key;
                } else {
                    key = e.key;
                }
                
                const keyId = inp.id.replace('key-', '');
                userConfig.keys[keyId] = key;
                inp.value = key;
                inp.blur();
                
                // 检查按键冲突
                checkKeyConflicts();
            };
        });
        
        // 阻止面板点击事件冒泡
        settingsPanel.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // 检查按键冲突
    function checkKeyConflicts() {
        const warningEl = document.getElementById('aa-conflict-warning');
        if (!warningEl) return;
        
        const usedKeys = new Map();
        const conflicts = [];
        const keyNames = {
            submit: '提交/确认',
            prev: '上一题',
            next: '下一题',
            forceUnlock: '强制解锁'
        };
        
        // 添加选项键名
        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(65 + i);
            keyNames[`op_${char}`] = `选项 ${char}`;
        }
        
        // 检查冲突
        for (const [id, key] of Object.entries(userConfig.keys)) {
            if (key && key.trim() !== '') {
                if (usedKeys.has(key)) {
                    const existingId = usedKeys.get(key);
                    conflicts.push(`按键 "${key}" 同时用于: ${keyNames[existingId]} 和 ${keyNames[id]}`);
                } else {
                    usedKeys.set(key, id);
                }
            }
        }
        
        if (conflicts.length > 0) {
            warningEl.innerHTML = '⚠️ 检测到按键冲突:<br>' + conflicts.join('<br>');
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    }

    // 保存设置
    function saveSettings() {
        if (!settingsPanel) return;
        
        // 检查按键冲突
        const warningEl = document.getElementById('aa-conflict-warning');
        if (warningEl && warningEl.style.display === 'block') {
            if (!confirm('检测到按键冲突，确定要继续保存吗？')) {
                return;
            }
        }
        
        saveConfig();
        closeSettingsPanel();
    }

    // 关闭设置面板
    function closeSettingsPanel() {
        if (settingsPanel) {
            settingsPanel.classList.remove('active');
        }
        if (settingsOverlay) {
            settingsOverlay.classList.remove('active');
        }
    }

    // 创建设置触发按钮
    function createSettingsTrigger() {
        // 移除已存在的按钮
        const oldTrigger = document.getElementById('aa-settings-trigger');
        if (oldTrigger) oldTrigger.remove();
        
        // 创建新按钮
        const trigger = document.createElement('button');
        trigger.id = 'aa-settings-trigger';
        trigger.innerHTML = '⚙️';
        trigger.title = '考试宝解析设置 (Alt+S)';
        
        // 恢复按钮位置
        if (userConfig.uiPos && userConfig.uiPos.top) {
            Object.assign(trigger.style, {
                bottom: 'auto',
                right: 'auto',
                top: userConfig.uiPos.top,
                left: userConfig.uiPos.left
            });
        }
        
        // 拖拽功能
        let isDragging = false;
        let startX, startY, initLeft, initTop;
        
        trigger.onmousedown = (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = trigger.getBoundingClientRect();
            initLeft = rect.left;
            initTop = rect.top;
            
            const onMove = (mv) => {
                if (!isDragging && (Math.abs(mv.clientX - startX) > 5 || Math.abs(mv.clientY - startY) > 5)) {
                    isDragging = true;
                }
                if (isDragging) {
                    Object.assign(trigger.style, {
                        bottom: 'auto',
                        right: 'auto',
                        left: `${initLeft + mv.clientX - startX}px`,
                        top: `${initTop + mv.clientY - startY}px`
                    });
                }
            };
            
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                if (isDragging) {
                    userConfig.uiPos = { top: trigger.style.top, left: trigger.style.left };
                    saveConfigSilent();
                }
            };
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };
        
        // 添加点击事件
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            createSettingsPanel();
            return false;
        });
        
        document.body.appendChild(trigger);
    }

    // 工具函数
    function rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        return '#000000';
    }

    function hexToRgba(hex, alpha = 0.1) {
        if (!hex || !hex.startsWith('#')) {
            return alpha === 0.3 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)';
        }
        
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 删除VIP信息框
    function removeVipBoxes() {
        const vipBoxes = document.querySelectorAll('.vip-quanyi');
        vipBoxes.forEach(box => {
            box.style.display = 'none';
            box.remove();
        });
    }

    // 主处理函数 - 修复解析内容显示
    function processPage() {
        // 删除VIP信息框
        if (userConfig.removeVipBox) {
            removeVipBoxes();
        }
        
        const aiAnalysisSection = document.querySelector('.mb16');
        if (!aiAnalysisSection) return false;
        
        // 移除VIP限制
        if (userConfig.removeVipRestriction) {
            const vipElements = aiAnalysisSection.querySelectorAll('.hide-ai-analysis, .analysis-mask, .check-all-btn-row, .lock-icon, .hide-ai-analysis-text');
            vipElements.forEach(el => {
                el.style.display = 'none';
                el.remove();
            });
            
            // 移除所有遮罩层
            const masks = document.querySelectorAll('.analysis-mask, .blur-mask, .mask-box, [class*="mask"], [class*="blur"]');
            masks.forEach(mask => {
                mask.style.display = 'none';
                mask.remove();
            });
            
            const analysisRows = aiAnalysisSection.querySelectorAll('.answer-analysis-row.hide-height, .hide-height');
            analysisRows.forEach(row => {
                row.style.cssText = `
                    max-height: none !important;
                    height: auto !important;
                    overflow: visible !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                `;
                row.classList.remove('hide-height');
            });
        }
        
        // 检查并处理所有解析内容
        const answerAnalysisElements = document.querySelectorAll('p.answer-analysis, .answer-analysis, .answer-box-detail, .analysis-content');
        if (answerAnalysisElements.length > 0) {
            answerAnalysisElements.forEach(el => {
                // 强制显示完整内容
                el.style.cssText = `
                    font-size: ${userConfig.fontSize}px !important;
                    line-height: ${userConfig.lineHeight} !important;
                    font-family: ${userConfig.fontFamily === 'inherit' ? 'inherit' : userConfig.fontFamily} !important;
                    color: ${userConfig.textColor} !important;
                    margin: 8px 0 !important;
                    padding: ${userConfig.padding}px !important;
                    background-color: ${userConfig.backgroundColor} !important;
                    border-radius: ${userConfig.borderRadius}px !important;
                    border-left: ${userConfig.borderLeftWidth}px solid ${userConfig.borderColor} !important;
                    max-height: none !important;
                    height: auto !important;
                    overflow: visible !important;
                    opacity: 1 !important;
                    filter: none !important;
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    display: block !important;
                    visibility: visible !important;
                    white-space: normal !important;
                    word-wrap: break-word !important;
                    word-break: break-word !important;
                    -webkit-line-clamp: unset !important;
                    line-clamp: unset !important;
                    position: relative !important;
                    z-index: 20 !important;
                `;
                
                // 修复父容器
                const parent = el.parentElement;
                if (parent && (parent.classList.contains('answer-analysis-row') || parent.classList.contains('hide-height'))) {
                    parent.style.cssText = `
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                    `;
                }
            });
            
            // 添加状态指示器
            const analysisTop = aiAnalysisSection.querySelector('.analysis-top');
            if (analysisTop) {
                const oldStatus = analysisTop.querySelector('.aa-replacement-status');
                if (oldStatus) oldStatus.remove();
                
                const statusDiv = document.createElement('div');
                statusDiv.className = 'aa-replacement-status aa-status-success';
                statusDiv.innerHTML = '✅ 已解锁完整解析';
                analysisTop.appendChild(statusDiv);
            }
            
            return true;
        }
        
        return false;
    }

    // 设置全局键盘事件监听
    function setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // 忽略输入框内的按键
            const tag = document.activeElement.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement.isContentEditable) {
                return;
            }
            
            const key = e.key;
            let handled = false;
            
            // 选项快捷键 (A-Z)
            for (let i = 0; i < 26; i++) {
                const char = String.fromCharCode(65 + i);
                const keyId = `op_${char}`;
                if (userConfig.keys[keyId] === key) {
                    selectOption(char);
                    showKeyIndicator(char);
                    handled = true;
                    break;
                }
            }
            
            // 功能快捷键
            if (!handled) {
                if (key === userConfig.keys.submit) {
                    handled = true;
                    if (userConfig.smartEnter) {
                        smartEnterAction();
                    } else {
                        clickByText('提交答案');
                        showKeyIndicator('📤');
                    }
                } else if (key === userConfig.keys.prev && userConfig.scriptNav) {
                    handled = true;
                    showKeyIndicator('←');
                    clickByText('上一题');
                } else if (key === userConfig.keys.next && userConfig.scriptNav) {
                    handled = true;
                    showKeyIndicator('→');
                    clickByText('下一题');
                } else if (key === userConfig.keys.forceUnlock) {
                    handled = true;
                    processPage();
                    showKeyIndicator('🔓');
                }
            }
            
            if (handled) {
                e.stopPropagation();
                e.preventDefault();
            }
        }, true);
    }

    // 注册菜单命令
    function registerMenuCommands() {
        try {
            GM_registerMenuCommand('⚙️ 打开设置面板', createSettingsPanel);
            GM_registerMenuCommand('🧠 显示快捷键提示', showShortcutHint);
            GM_registerMenuCommand('🔓 立即解锁解析', () => {
                processPage();
                GM_notification({
                    title: '考试宝解析',
                    text: '已解锁所有解析内容',
                    timeout: 1500
                });
            });
        } catch (e) {
            console.log('菜单注册失败:', e);
        }
    }

    // 主入口
    function init() {
        console.log('考试宝AI解析美化增强版已启动 V1.3 - 修复了解析内容显示问题');
        
        // 初始化配置
        initConfig();
        
        // 应用样式
        updateStyles();
        
        // 创建设置按钮
        setTimeout(() => {
            createSettingsTrigger();
            // 显示快捷键提示
            showShortcutHint();
        }, 1500);
        
        // 注册菜单
        registerMenuCommands();
        
        // 设置键盘事件
        setupKeyboardEvents();
        
        // 初始处理
        setTimeout(() => {
            processPage();
            
            // 定时扫描并修复
            setInterval(() => {
                if (userConfig.autoReplace) {
                    processPage();
                    // 额外修复可能残留的问题
                    fixRemainingIssues();
                }
            }, userConfig.scanInterval);
        }, 2000);
        
        // 添加键盘快捷键（Alt+S打开设置）
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                createSettingsPanel();
            }
        });
    }
    
    // 修复残留的问题
    function fixRemainingIssues() {
        // 移除任何可能的遮罩
        const masks = document.querySelectorAll('[style*="opacity"], [style*="filter"], [class*="mask"], [class*="blur"]');
        masks.forEach(el => {
            if (el.style.opacity === '0' || el.style.filter?.includes('blur')) {
                el.style.display = 'none';
            }
        });
        
        // 确保解析内容完全可见
        const analysisElements = document.querySelectorAll('.answer-analysis, .answer-box-detail');
        analysisElements.forEach(el => {
            if (el.offsetHeight < el.scrollHeight) {
                el.style.maxHeight = 'none';
                el.style.height = 'auto';
            }
        });
    }

    // 页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }

})();
