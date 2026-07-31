with open("index.html", "r") as f:
    content = f.read()

html_to_insert = """
        <!-- Token Details Overlay -->
        <div id="token-details-modal" class="modal-overlay hidden" style="background-color: var(--bg-color); z-index: 200;">
            <div class="token-details-container" style="display: flex; flex-direction: column; height: 100%; width: 100%; padding: 16px;">
                <div class="td-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <button class="icon-btn td-back-btn" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%;"><i class="ph-bold ph-caret-left"></i></button>
                    <div class="td-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="" id="td-logo" alt="" style="width: 24px; height: 24px; border-radius: 50%;">
                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
                            <span style="font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 4px; color: #fff;" id="td-name">Solana <i class="ph-fill ph-seal-check" style="color: var(--accent-purple);"></i></span>
                            <span style="font-size: 12px; color: #4CAF50; font-weight: 500;" id="td-people"><span style="display:inline-block; width:6px; height:6px; background-color:#4CAF50; border-radius:50%; margin-right:4px;"></span>329 people here</span>
                        </div>
                    </div>
                    <button class="icon-btn td-options-btn" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%;"><i class="ph-bold ph-faders"></i></button>
                </div>
                
                <div class="td-price-section" style="margin-bottom: 24px;">
                    <h1 id="td-price" style="font-size: 48px; font-weight: 700; letter-spacing: -1px; margin-bottom: 8px;">$0.00</h1>
                    <div class="td-change" id="td-change" style="font-size: 14px; font-weight: 600; display: flex; gap: 8px;"><span style="color: var(--accent-green);">+$0.00</span> <span style="background: var(--accent-green); color: #000; padding: 2px 6px; border-radius: 6px;">+0.00%</span></div>
                </div>

                <div class="td-chart" style="flex: 1; min-height: 150px; margin-bottom: 24px; position: relative;">
                    <svg viewBox="0 0 400 150" preserveAspectRatio="none" style="width: 100%; height: 100%;"><path d="M0 120 Q 20 80, 50 100 T 100 40 T 150 90 T 200 60 T 250 110 T 300 20 T 350 50 T 400 30" fill="none" stroke="var(--accent-green)" stroke-width="3" stroke-linejoin="round"/></svg>
                </div>

                <div class="td-timeframes" style="display: flex; justify-content: space-between; margin-bottom: 24px; padding: 0 16px;">
                    <button style="background: none; border: none; color: #666; font-weight: 600; font-size: 13px;">1H</button>
                    <button style="background: rgba(255,255,255,0.1); border: none; color: #fff; font-weight: 600; font-size: 13px; padding: 6px 12px; border-radius: 12px;">1D</button>
                    <button style="background: none; border: none; color: #666; font-weight: 600; font-size: 13px;">1W</button>
                    <button style="background: none; border: none; color: #666; font-weight: 600; font-size: 13px;">1M</button>
                    <button style="background: none; border: none; color: #666; font-weight: 600; font-size: 13px;">YTD</button>
                    <button style="background: none; border: none; color: #666; font-weight: 600; font-size: 13px;">ALL</button>
                </div>

                <div class="td-actions" style="display: flex; gap: 12px; justify-content: space-between; margin-bottom: 24px;">
                    <button style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 12px 0; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 500; font-size: 13px;"><i class="ph ph-paper-plane-tilt" style="font-size: 20px;"></i> Send</button>
                    <button style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 12px 0; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 500; font-size: 13px;"><i class="ph ph-trend-up" style="font-size: 20px;"></i> Long</button>
                    <button style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 12px 0; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 500; font-size: 13px;"><i class="ph ph-trend-down" style="font-size: 20px;"></i> Short</button>
                    <button style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 12px 0; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 500; font-size: 13px;"><i class="ph ph-dots-three" style="font-size: 20px;"></i> More</button>
                </div>

                <div class="td-position" style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">Position <i class="ph-bold ph-caret-right" style="color: #666; margin-left: 4px;"></i></h3>
                    <div style="display: flex; gap: 12px;">
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 16px;">
                            <div style="color: #666; font-size: 13px; margin-bottom: 4px;">Value</div>
                            <div style="color: #fff; font-size: 18px; font-weight: 600;" id="td-pos-value">$0.00</div>
                        </div>
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 16px;">
                            <div style="color: #666; font-size: 13px; margin-bottom: 4px;">Balance</div>
                            <div style="color: #909090; font-size: 16px; font-weight: 600;" id="td-pos-balance">0</div>
                        </div>
                    </div>
                </div>

                <div class="td-trade-buttons" style="display: flex; gap: 12px;">
                    <button id="td-buy-btn" style="flex: 1; background: var(--accent-purple); color: #000; border: none; padding: 16px; border-radius: 24px; font-size: 16px; font-weight: 600; font-family: var(--font-main);">Buy</button>
                    <button id="td-sell-btn" style="flex: 1; background: var(--accent-purple); color: #000; border: none; padding: 16px; border-radius: 24px; font-size: 16px; font-weight: 600; font-family: var(--font-main);">Sell</button>
                </div>
            </div>
        </div>

        <!-- Trading Overlay (Buy/Sell) -->
        <div id="trading-modal" class="modal-overlay hidden" style="background-color: var(--bg-color); z-index: 300;">
            <div class="trading-container" style="display: flex; flex-direction: column; height: 100%; width: 100%; padding: 16px;">
                <div class="trade-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px;">
                    <button class="icon-btn trade-back-btn" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%;"><i class="ph-bold ph-caret-left"></i></button>
                    <div class="trade-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="" id="trade-logo" alt="" style="width: 24px; height: 24px; border-radius: 50%;">
                        <span id="trade-action-title" style="font-weight: 600; font-size: 16px; color: #fff;">Sell SOL <i class="ph-fill ph-seal-check" style="color: var(--accent-purple);"></i></span>
                    </div>
                    <button class="icon-btn trade-options-btn" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%;"><i class="ph-bold ph-faders"></i></button>
                </div>
                
                <div class="trade-amount-section" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 48px;">
                    <h1 id="trade-input-display" style="font-size: 72px; font-weight: 600; letter-spacing: -2px; margin-bottom: 8px; color: #fff;">$0</h1>
                    <span id="trade-available" style="color: #909090; font-size: 14px;">$0.00 available</span>
                </div>

                <div class="trade-receive-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div class="trade-receive-left" style="display: flex; align-items: center; gap: 8px;">
                        <div class="trade-coin-icon" style="width: 24px; height: 24px; background: #252525; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i class="ph-fill ph-money" style="color: var(--accent-purple);"></i></div>
                        <span id="trade-receive-label" style="color: #fff; font-size: 15px; font-weight: 600;">Receive Cash <i class="ph-bold ph-caret-down" style="color: #666;"></i></span>
                    </div>
                    <span id="trade-receive-amount" style="color: #909090; font-size: 15px;">$0.00 <i class="ph-bold ph-arrows-down-up" style="color: #666;"></i></span>
                </div>

                <div class="trade-quick-percents" style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <button class="pct-btn" data-pct="0.25" style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 14px 0; border-radius: 20px; font-weight: 600; font-size: 14px;">25%</button>
                    <button class="pct-btn" data-pct="0.50" style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 14px 0; border-radius: 20px; font-weight: 600; font-size: 14px;">50%</button>
                    <button class="pct-btn" data-pct="1.0" style="flex: 1; background: rgba(255,255,255,0.05); border: none; color: #ccc; padding: 14px 0; border-radius: 20px; font-weight: 600; font-size: 14px;">Sell all</button>
                </div>

                <div class="trade-keypad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; flex: 1;">
                    <!-- Keypad buttons -->
                </div>
                
                <button id="trade-confirm-btn" class="trade-confirm" style="width: 100%; background: var(--accent-purple); color: #000; border: none; padding: 18px; border-radius: 24px; font-size: 16px; font-weight: 600; font-family: var(--font-main); margin-bottom: 16px; opacity: 0.5; pointer-events: none;">Review Order</button>
            </div>
        </div>
"""

# Insert right before the closing </div> of app-container
pos = content.rfind("</div>\n    <script src=\"script.js\"></script>")
if pos != -1:
    new_content = content[:pos] + html_to_insert + content[pos:]
    with open("index.html", "w") as f:
        f.write(new_content)
    print("HTML inserted successfully.")
else:
    print("Could not find insertion point.")
