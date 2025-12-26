// ==UserScript==
// @name         考试宝AI解析替换与美化
// @namespace    /
// @version      V0.5
// @description  替换考试宝AI解析框内容，支持自定义设置
// @author       大聪明
// @match        *://*.kaoshibao.com/*
// @downloadURL  https://raw.githubusercontent.com/zhuqq2020/kaoshibao_Answer_analysis_box/refs/heads/main/main.user.js
// @updateURL    https://raw.githubusercontent.com/zhuqq2020/kaoshibao_Answer_analysis_box/refs/heads/main/main.user.js
// @grant       GM_addStyle
// @grant       GM_notification
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @license     MIT
// ==/UserScript==

(function() {
    'use strict';

    // 默认配置
    const DEFAULT_CONFIG = {
        // 基本功能
        autoReplace: true,
        removeVipRestriction: true,
        showFullContent: true,
        removeVipBox: true,
        scanInterval: 2000,

        // 样式设置
        fontSize: 14,
        lineHeight: 1.6,
        fontFamily: "'Microsoft YaHei', 'Segoe UI', sans-serif",
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
        borderLeftWidth: 4
    };

    // 全局变量
    let userConfig = { ...DEFAULT_CONFIG };
    let settingsPanel = null;
    let settingsOverlay = null;

    // 初始化配置
    function initConfig() {
        try {
            const savedConfig = GM_getValue('aa_config');
            if (savedConfig) {
                userConfig = { ...DEFAULT_CONFIG, ...savedConfig };
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

    // 更新样式
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

        styleElement.textContent = `
            /* 隐藏VIP限制元素 */
            .hide-ai-analysis,
            .analysis-mask,
            .check-all-btn-row {
                display: none !important;
            }

            /* 删除VIP信息框 */
            .vip-quanyi {
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
                font-size: ${userConfig.fontSize}px !important;
                line-height: ${userConfig.lineHeight} !important;
                font-family: ${userConfig.fontFamily} !important;
                color: ${userConfig.textColor} !important;
                margin: 8px 0 !important;
                padding: ${userConfig.padding}px !important;
                background-color: ${userConfig.backgroundColor} !important;
                border-radius: ${userConfig.borderRadius}px !important;
                border-left: ${userConfig.borderLeftWidth}px solid ${userConfig.borderColor} !important;
                box-shadow: ${boxShadowValue} !important;
                text-shadow: ${textShadowValue} !important;
                transition: all 0.3s ease !important;
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

            /* 设置面板样式 */
            #aa-settings-panel {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 450px !important;
                max-height: 80vh !important;
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
            }

            .aa-settings-content {
                padding: 20px !important;
                max-height: calc(80vh - 70px) !important;
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
            }

            .aa-setting-input:focus {
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
        `;
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

        settingsPanel.innerHTML = `
            <div class="aa-settings-header">
                <span>📝 考试宝解析设置</span>
                <button id="aa-settings-close">×</button>
            </div>
            <div class="aa-settings-content">
                <div class="aa-settings-group">
                    <div class="aa-settings-title">基本功能</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">自动解锁VIP限制</span>
                        <div class="aa-setting-switch ${userConfig.removeVipRestriction ? 'active' : ''}"
                             data-setting="removeVipRestriction"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">显示完整解析内容</span>
                        <div class="aa-setting-switch ${userConfig.showFullContent ? 'active' : ''}"
                             data-setting="showFullContent"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">删除VIP推广信息框</span>
                        <div class="aa-setting-switch ${userConfig.removeVipBox ? 'active' : ''}"
                             data-setting="removeVipBox"></div>
                    </div>
                </div>

                <div class="aa-settings-group">
                    <div class="aa-settings-title">字体设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">字体大小</span>
                        <input type="number" class="aa-setting-input" id="aa-fontSize"
                               value="${userConfig.fontSize}" min="10" max="20">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">行高</span>
                        <input type="number" class="aa-setting-input" id="aa-lineHeight"
                               value="${userConfig.lineHeight}" step="0.1" min="1.2" max="2.0">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">字体样式</span>
                        <select class="aa-setting-input" id="aa-fontFamily" style="width: 120px;">
                            <option value="'Microsoft YaHei', 'Segoe UI', sans-serif" ${userConfig.fontFamily.includes('Microsoft YaHei') ? 'selected' : ''}>微软雅黑</option>
                            <option value="'SimSun', serif" ${userConfig.fontFamily.includes('SimSun') ? 'selected' : ''}>宋体</option>
                            <option value="'SimHei', sans-serif" ${userConfig.fontFamily.includes('SimHei') ? 'selected' : ''}>黑体</option>
                            <option value="'Arial', sans-serif" ${userConfig.fontFamily.includes('Arial') ? 'selected' : ''}>Arial</option>
                            <option value="'Courier New', monospace" ${userConfig.fontFamily.includes('Courier') ? 'selected' : ''}>等宽字体</option>
                        </select>
                    </div>
                </div>

                <div class="aa-settings-group">
                    <div class="aa-settings-title">颜色设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">背景颜色</span>
                        <input type="color" class="aa-setting-color" id="aa-backgroundColor"
                               value="${userConfig.backgroundColor}">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">边框颜色</span>
                        <input type="color" class="aa-setting-color" id="aa-borderColor"
                               value="${userConfig.borderColor}">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">文字颜色</span>
                        <input type="color" class="aa-setting-color" id="aa-textColor"
                               value="${userConfig.textColor}">
                    </div>
                </div>

                <div class="aa-settings-group">
                    <div class="aa-settings-title">📝 文字阴影设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">启用文字阴影</span>
                        <div class="aa-setting-switch ${userConfig.textShadowEnabled ? 'active' : ''}"
                             data-setting="textShadowEnabled"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">阴影颜色</span>
                        <input type="color" class="aa-setting-color" id="aa-textShadowColor"
                               value="${rgbToHex(userConfig.textShadowColor)}">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">水平偏移</span>
                        <input type="number" class="aa-setting-input" id="aa-textShadowX"
                               value="${userConfig.textShadowX}" min="-5" max="5">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">垂直偏移</span>
                        <input type="number" class="aa-setting-input" id="aa-textShadowY"
                               value="${userConfig.textShadowY}" min="-5" max="5">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">模糊半径</span>
                        <input type="number" class="aa-setting-input" id="aa-textShadowBlur"
                               value="${userConfig.textShadowBlur}" min="0" max="10">
                    </div>
                </div>

                <div class="aa-settings-group">
                    <div class="aa-settings-title">🖼️ 解析框阴影设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">启用框阴影</span>
                        <div class="aa-setting-switch ${userConfig.boxShadowEnabled ? 'active' : ''}"
                             data-setting="boxShadowEnabled"></div>
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">阴影颜色</span>
                        <input type="color" class="aa-setting-color" id="aa-boxShadowColor"
                               value="${rgbToHex(userConfig.boxShadowColor)}">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">水平偏移</span>
                        <input type="number" class="aa-setting-input" id="aa-boxShadowX"
                               value="${userConfig.boxShadowX}" min="-10" max="10">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">垂直偏移</span>
                        <input type="number" class="aa-setting-input" id="aa-boxShadowY"
                               value="${userConfig.boxShadowY}" min="0" max="20">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">模糊半径</span>
                        <input type="number" class="aa-setting-input" id="aa-boxShadowBlur"
                               value="${userConfig.boxShadowBlur}" min="0" max="30">
                    </div>
                </div>

                <div class="aa-settings-group">
                    <div class="aa-settings-title">高级设置</div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">圆角大小</span>
                        <input type="number" class="aa-setting-input" id="aa-borderRadius"
                               value="${userConfig.borderRadius}" min="0" max="20">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">内边距</span>
                        <input type="number" class="aa-setting-input" id="aa-padding"
                               value="${userConfig.padding}" min="5" max="30">
                    </div>
                    <div class="aa-setting-item">
                        <span class="aa-setting-label">边框宽度</span>
                        <input type="number" class="aa-setting-input" id="aa-borderLeftWidth"
                               value="${userConfig.borderLeftWidth}" min="1" max="10">
                    </div>
                </div>

                <div class="aa-settings-buttons">
                    <button class="aa-settings-btn aa-settings-save" id="aa-settings-save">💾 保存设置</button>
                    <button class="aa-settings-btn aa-settings-reset" id="aa-settings-reset">🔄 恢复默认</button>
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
                if (confirm('确定要恢复所有设置为默认值吗？')) {
                    userConfig = { ...DEFAULT_CONFIG };
                    saveSettings();
                }
            });
        }

        // 阻止面板点击事件冒泡
        settingsPanel.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // 保存设置
    function saveSettings() {
        if (!settingsPanel) return;

        // 收集输入值
        try {
            // 基本字体设置
            const fontSizeInput = settingsPanel.querySelector('#aa-fontSize');
            const lineHeightInput = settingsPanel.querySelector('#aa-lineHeight');
            const fontFamilyInput = settingsPanel.querySelector('#aa-fontFamily');

            // 颜色设置
            const backgroundColorInput = settingsPanel.querySelector('#aa-backgroundColor');
            const borderColorInput = settingsPanel.querySelector('#aa-borderColor');
            const textColorInput = settingsPanel.querySelector('#aa-textColor');

            // 文字阴影设置
            const textShadowColorInput = settingsPanel.querySelector('#aa-textShadowColor');
            const textShadowXInput = settingsPanel.querySelector('#aa-textShadowX');
            const textShadowYInput = settingsPanel.querySelector('#aa-textShadowY');
            const textShadowBlurInput = settingsPanel.querySelector('#aa-textShadowBlur');

            // 解析框阴影设置
            const boxShadowColorInput = settingsPanel.querySelector('#aa-boxShadowColor');
            const boxShadowXInput = settingsPanel.querySelector('#aa-boxShadowX');
            const boxShadowYInput = settingsPanel.querySelector('#aa-boxShadowY');
            const boxShadowBlurInput = settingsPanel.querySelector('#aa-boxShadowBlur');

            // 高级设置
            const borderRadiusInput = settingsPanel.querySelector('#aa-borderRadius');
            const paddingInput = settingsPanel.querySelector('#aa-padding');
            const borderLeftWidthInput = settingsPanel.querySelector('#aa-borderLeftWidth');

            // 应用字体设置
            if (fontSizeInput) userConfig.fontSize = parseInt(fontSizeInput.value) || DEFAULT_CONFIG.fontSize;
            if (lineHeightInput) userConfig.lineHeight = parseFloat(lineHeightInput.value) || DEFAULT_CONFIG.lineHeight;
            if (fontFamilyInput) userConfig.fontFamily = fontFamilyInput.value || DEFAULT_CONFIG.fontFamily;

            // 应用颜色设置
            if (backgroundColorInput) userConfig.backgroundColor = backgroundColorInput.value || DEFAULT_CONFIG.backgroundColor;
            if (borderColorInput) userConfig.borderColor = borderColorInput.value || DEFAULT_CONFIG.borderColor;
            if (textColorInput) userConfig.textColor = textColorInput.value || DEFAULT_CONFIG.textColor;

            // 应用文字阴影设置
            if (textShadowColorInput) {
                userConfig.textShadowColor = hexToRgba(textShadowColorInput.value || '#000000', 0.3);
            }
            if (textShadowXInput) userConfig.textShadowX = parseInt(textShadowXInput.value) || DEFAULT_CONFIG.textShadowX;
            if (textShadowYInput) userConfig.textShadowY = parseInt(textShadowYInput.value) || DEFAULT_CONFIG.textShadowY;
            if (textShadowBlurInput) userConfig.textShadowBlur = parseInt(textShadowBlurInput.value) || DEFAULT_CONFIG.textShadowBlur;

            // 应用解析框阴影设置
            if (boxShadowColorInput) {
                userConfig.boxShadowColor = hexToRgba(boxShadowColorInput.value || '#000000', 0.1);
            }
            if (boxShadowXInput) userConfig.boxShadowX = parseInt(boxShadowXInput.value) || DEFAULT_CONFIG.boxShadowX;
            if (boxShadowYInput) userConfig.boxShadowY = parseInt(boxShadowYInput.value) || DEFAULT_CONFIG.boxShadowY;
            if (boxShadowBlurInput) userConfig.boxShadowBlur = parseInt(boxShadowBlurInput.value) || DEFAULT_CONFIG.boxShadowBlur;

            // 应用高级设置
            if (borderRadiusInput) userConfig.borderRadius = parseInt(borderRadiusInput.value) || DEFAULT_CONFIG.borderRadius;
            if (paddingInput) userConfig.padding = parseInt(paddingInput.value) || DEFAULT_CONFIG.padding;
            if (borderLeftWidthInput) userConfig.borderLeftWidth = parseInt(borderLeftWidthInput.value) || DEFAULT_CONFIG.borderLeftWidth;

            saveConfig();

        } catch (e) {
            console.error('保存设置时出错:', e);
            GM_notification({
                title: '保存失败',
                text: '保存设置时出错，请重试',
                timeout: 3000
            });
        }
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

    // 主处理函数
    function processPage() {
        // 删除VIP信息框
        if (userConfig.removeVipBox) {
            removeVipBoxes();
        }

        const aiAnalysisSection = document.querySelector('.mb16');
        if (!aiAnalysisSection) return false;

        // 移除VIP限制
        if (userConfig.removeVipRestriction) {
            const vipElements = aiAnalysisSection.querySelectorAll('.hide-ai-analysis, .analysis-mask, .check-all-btn-row');
            vipElements.forEach(el => {
                el.style.display = 'none';
                el.remove();
            });

            const analysisRows = aiAnalysisSection.querySelectorAll('.answer-analysis-row.hide-height');
            analysisRows.forEach(row => {
                row.style.maxHeight = 'none';
                row.style.overflow = 'visible';
                row.classList.remove('hide-height');
            });
        }

        // 检查是否有答案分析内容
        const answerAnalysis = document.querySelector('p.answer-analysis');
        if (answerAnalysis) {
            // 显示完整内容
            if (userConfig.showFullContent) {
                answerAnalysis.style.cssText = `
                    max-height: none !important;
                    overflow: visible !important;
                    opacity: 1 !important;
                    filter: none !important;
                    user-select: text !important;
                    -webkit-user-select: text !important;
                `;

                const parentDiv = answerAnalysis.parentElement;
                if (parentDiv) {
                    parentDiv.style.overflow = 'visible';
                }
            }

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

    // 注册菜单命令
    function registerMenuCommands() {
        try {
            GM_registerMenuCommand('⚙️ 打开设置面板', createSettingsPanel);
            GM_registerMenuCommand('🗑️ 删除VIP信息框', removeVipBoxes);
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
        console.log('考试宝AI解析美化脚本已启动 V0.7');

        // 初始化配置
        initConfig();

        // 应用样式
        updateStyles();

        // 创建设置按钮
        setTimeout(createSettingsTrigger, 1500);

        // 注册菜单
        registerMenuCommands();

        // 初始处理
        setTimeout(() => {
            processPage();

            // 定时扫描
            setInterval(() => {
                if (userConfig.autoReplace) {
                    processPage();
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

    // 页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }

})();
