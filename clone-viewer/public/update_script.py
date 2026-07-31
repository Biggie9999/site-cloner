import re

new_script = """document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const defaultState = {
        handle: '@DecentFlora1109',
        accountName: 'Wallet 1',
        mainBalance: '$0.00',
        changeAmount: '+$0.00',
        changePercent: '+0.00%',
        cashAmount: '$0.00',
        tokens: [
            { name: 'Solana', amount: '20 SOL', fiatValue: '$0.00', fiatChange: '$0.00', changeType: 'neutral', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', tokenAddress: 'So11111111111111111111111111111111111111112', entryInvestment: '', entryMcap: '', priceUsd: 0 },
            { name: 'USDC', amount: '0 USDC', fiatValue: '$0.00', fiatChange: '$0.00', changeType: 'neutral', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029', tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', entryInvestment: '', entryMcap: '', priceUsd: 1 }
        ]
    };

    function loadState() {
        const saved = localStorage.getItem('phantomWalletStateV2');
        if (saved) {
            try { return JSON.parse(saved); } catch(e) {}
        }
        return defaultState;
    }

    function saveState() {
        localStorage.setItem('phantomWalletStateV2', JSON.stringify(appState));
    }

    let appState = loadState();

    // --- DOM Elements ---
    const handleEl = document.querySelector('.handle');
    const accountNameEl = document.querySelector('.account-name');
    const mainBalanceEl = document.querySelector('.balance-amount');
    const changeAmountEl = document.querySelector('.change-amount');
    const changePercentEl = document.querySelector('.change-percent');
    const cashAmountEl = document.querySelector('.cash-amount');
    const tokenListEl = document.querySelector('.token-list');

    // Overlays
    const tokenDetailsModal = document.getElementById('token-details-modal');
    const tradingModal = document.getElementById('trading-modal');

    // Current Trading Context
    let currentToken = null;
    let currentTradeAction = null; // 'buy' or 'sell'
    let tradeInputValue = "0"; // String to handle keypad

    // Helper: format numbers
    function formatMoney(num) { return '$' + parseFloat(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
    function parseMoney(str) { return parseFloat((str || "0").toString().replace(/[^0-9.-]+/g, "")) || 0; }

    function getSolToken() { return appState.tokens.find(t => t.name === 'Solana'); }

    // --- Rendering Logic ---
    function renderApp() {
        appState.tokens.sort((a, b) => parseMoney(b.fiatValue) - parseMoney(a.fiatValue));

        let totalFiatSum = parseMoney(appState.cashAmount);
        appState.tokens.forEach(token => { totalFiatSum += parseMoney(token.fiatValue); });
        appState.mainBalance = formatMoney(totalFiatSum);

        if(handleEl) handleEl.textContent = appState.handle;
        accountNameEl.textContent = appState.accountName;
        mainBalanceEl.textContent = appState.mainBalance;
        changeAmountEl.textContent = appState.changeAmount;
        
        const main = parseMoney(appState.mainBalance);
        const change = parseMoney(appState.changeAmount);
        let calculatedPercent = "+0.00%";
        if (!isNaN(main) && !isNaN(change) && (main - change) !== 0) {
            const percent = (change / (main - change)) * 100;
            calculatedPercent = (percent >= 0 ? "+" : "") + percent.toFixed(2) + "%";
        }
        changePercentEl.textContent = calculatedPercent;

        if (change < 0) {
            changeAmountEl.classList.add('negative-change');
            changePercentEl.classList.add('negative-change');
        } else {
            changeAmountEl.classList.remove('negative-change');
            changePercentEl.classList.remove('negative-change');
        }

        cashAmountEl.textContent = appState.cashAmount;

        tokenListEl.innerHTML = '';
        appState.tokens.forEach((token, index) => {
            const tokenHTML = `
                <div class="token-item" data-name="${token.name}">
                    <div class="token-icon">
                        <img src="${token.logo}" alt="${token.name}">
                    </div>
                    <div class="token-details">
                        <div class="token-name-row">
                            <span class="token-name">${token.name}</span>
                            <i class="ph-fill ph-seal-check verified"></i>
                        </div>
                        <span class="token-amount">${token.amount}</span>
                    </div>
                    <div class="token-value">
                        <span class="fiat-value">${token.fiatValue}</span>
                        <span class="fiat-change ${token.changeType}">${token.fiatChange}</span>
                    </div>
                </div>
            `;
            tokenListEl.insertAdjacentHTML('beforeend', tokenHTML);
        });

        document.querySelectorAll('.token-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.getAttribute('data-name');
                const t = appState.tokens.find(tk => tk.name === name);
                if (t) openTokenDetails(t);
            });
        });
        saveState();
    }

    renderApp();

    // --- Live DexScreener Fetching ---
    async function fetchLiveUpdates() {
        const addresses = appState.tokens.map(t => t.tokenAddress).filter(addr => addr);
        if (addresses.length === 0) return;
        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses.join(',')}`);
            const data = await response.json();
            
            let totalCurrentDynamicValue = 0;
            let totalPreviousDynamicValue = 0;
            let hasUpdates = false;

            if (data && data.pairs) {
                appState.tokens.forEach(token => {
                    const pair = data.pairs.find(p => p.baseToken.address === token.tokenAddress);
                    if (pair) {
                        const currentPrice = parseFloat(pair.priceUsd) || 0;
                        token.priceUsd = currentPrice;
                        
                        const tokenAmount = parseFloat(token.amount.split(' ')[0]) || 0;
                        const currentValue = tokenAmount * currentPrice;
                        const change24h = pair.priceChange && pair.priceChange.h24 ? parseFloat(pair.priceChange.h24) : 0;
                        
                        token.fiatValue = formatMoney(currentValue);
                        token.fiatChange = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
                        token.changeType = change24h >= 0 ? 'positive' : 'negative';
                        
                        totalCurrentDynamicValue += currentValue;
                        const previousValue = currentValue / (1 + (change24h / 100));
                        totalPreviousDynamicValue += previousValue;
                        hasUpdates = true;
                    }
                });
            }
            if (hasUpdates) {
                if (totalPreviousDynamicValue > 0) {
                    const dollarChange = totalCurrentDynamicValue - totalPreviousDynamicValue;
                    appState.changeAmount = `${dollarChange >= 0 ? '+' : '-'}${formatMoney(Math.abs(dollarChange))}`;
                }
                renderApp();
                if(!tokenDetailsModal.classList.contains('hidden') && currentToken) {
                    openTokenDetails(currentToken); // re-render details
                }
            }
        } catch(e) { console.error(e); }
    }

    setInterval(fetchLiveUpdates, 5000);
    fetchLiveUpdates();

    // --- Overlays Logic ---
    function openTokenDetails(token) {
        currentToken = token;
        document.getElementById('td-logo').src = token.logo;
        document.getElementById('td-name').innerHTML = `${token.name} <i class="ph-fill ph-seal-check" style="color: var(--accent-purple);"></i>`;
        document.getElementById('td-price').textContent = formatMoney(token.priceUsd);
        document.getElementById('td-change').innerHTML = `<span style="color: ${token.changeType==='positive'?'var(--accent-green)':'var(--accent-red)'};">${token.fiatChange}</span> <span style="background: ${token.changeType==='positive'?'var(--accent-green)':'var(--accent-red)'}; color: #000; padding: 2px 6px; border-radius: 6px;">${token.fiatChange}</span>`;
        document.getElementById('td-pos-value').textContent = token.fiatValue;
        document.getElementById('td-pos-balance').textContent = token.amount;
        
        tokenDetailsModal.classList.remove('hidden');
    }

    document.querySelector('.td-back-btn').addEventListener('click', () => {
        tokenDetailsModal.classList.add('hidden');
        currentToken = null;
    });

    // Trade Buttons
    document.getElementById('td-buy-btn').addEventListener('click', () => openTrading('buy'));
    document.getElementById('td-sell-btn').addEventListener('click', () => openTrading('sell'));

    function openTrading(action) {
        currentTradeAction = action;
        tradeInputValue = "0";
        updateTradeDisplay();
        
        document.getElementById('trade-logo').src = currentToken.logo;
        const actionText = action === 'buy' ? 'Buy' : 'Sell';
        document.getElementById('trade-action-title').innerHTML = `${actionText} ${currentToken.name} <i class="ph-fill ph-seal-check" style="color: var(--accent-purple);"></i>`;
        
        // Setup receive row
        const rcvIcon = document.querySelector('.trade-coin-icon');
        const rcvLabel = document.getElementById('trade-receive-label');
        if (action === 'buy') {
            rcvIcon.innerHTML = `<img src="${currentToken.logo}" style="width:100%;height:100%;border-radius:50%;">`;
            rcvLabel.innerHTML = `Receive ${currentToken.name} <i class="ph-bold ph-caret-down" style="color: #666;"></i>`;
        } else {
            if (currentToken.name === 'Solana') {
                rcvIcon.innerHTML = `<i class="ph-fill ph-money" style="color: var(--accent-purple);"></i>`;
                rcvLabel.innerHTML = `Receive Cash <i class="ph-bold ph-caret-down" style="color: #666;"></i>`;
            } else {
                rcvIcon.innerHTML = `<img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" style="width:100%;height:100%;border-radius:50%;">`;
                rcvLabel.innerHTML = `Receive SOL <i class="ph-bold ph-caret-down" style="color: #666;"></i>`;
            }
        }
        
        tradingModal.classList.remove('hidden');
    }

    document.querySelector('.trade-back-btn').addEventListener('click', () => {
        tradingModal.classList.add('hidden');
    });

    // Keypad Logic
    const keypadButtons = document.querySelectorAll('.trade-keypad button');
    // Assign keypad text if not already set (rebuilding grid)
    const keypadLayout = ['1','2','3','4','5','6','7','8','9','.','0','DEL'];
    const keypadContainer = document.querySelector('.trade-keypad');
    keypadContainer.innerHTML = '';
    keypadLayout.forEach(k => {
        const btn = document.createElement('button');
        if(k==='DEL') btn.innerHTML = '<i class="ph-bold ph-caret-left"></i>';
        else btn.textContent = k;
        
        btn.addEventListener('click', () => {
            if(k === 'DEL') {
                tradeInputValue = tradeInputValue.slice(0, -1);
                if(tradeInputValue === "") tradeInputValue = "0";
            } else if(k === '.') {
                if(!tradeInputValue.includes('.')) tradeInputValue += '.';
            } else {
                if(tradeInputValue === "0") tradeInputValue = k;
                else tradeInputValue += k;
            }
            // limit decimal places to 2
            const parts = tradeInputValue.split('.');
            if(parts.length === 2 && parts[1].length > 2) {
                tradeInputValue = parts[0] + '.' + parts[1].slice(0,2);
            }
            updateTradeDisplay();
        });
        keypadContainer.appendChild(btn);
    });

    function updateTradeDisplay() {
        document.getElementById('trade-input-display').textContent = `$${tradeInputValue}`;
        
        const inputUsd = parseFloat(tradeInputValue) || 0;
        const solToken = getSolToken();
        const availableTitle = document.getElementById('trade-available');
        const confirmBtn = document.getElementById('trade-confirm-btn');
        const receiveAmt = document.getElementById('trade-receive-amount');
        
        let hasEnough = false;
        
        if (currentTradeAction === 'buy') {
            // Buying token uses SOL (unless buying SOL, then uses Cash)
            if (currentToken.name === 'Solana') {
                const cashAvail = parseMoney(appState.cashAmount);
                availableTitle.textContent = `${formatMoney(cashAvail)} available`;
                hasEnough = inputUsd <= cashAvail && inputUsd > 0;
                const tokenAmt = currentToken.priceUsd ? inputUsd / currentToken.priceUsd : 0;
                receiveAmt.innerHTML = `${tokenAmt.toLocaleString('en-US', {maximumFractionDigits:4})} ${currentToken.name} <i class="ph-bold ph-arrows-down-up" style="color: #666;"></i>`;
            } else {
                const solAvailUsd = parseMoney(solToken.fiatValue);
                availableTitle.textContent = `${formatMoney(solAvailUsd)} available in SOL`;
                hasEnough = inputUsd <= solAvailUsd && inputUsd > 0;
                const tokenAmt = currentToken.priceUsd ? inputUsd / currentToken.priceUsd : 0;
                receiveAmt.innerHTML = `${tokenAmt.toLocaleString('en-US', {maximumFractionDigits:4})} ${currentToken.name} <i class="ph-bold ph-arrows-down-up" style="color: #666;"></i>`;
            }
        } else {
            // Selling token
            const tokenAvailUsd = parseMoney(currentToken.fiatValue);
            availableTitle.textContent = `${formatMoney(tokenAvailUsd)} available`;
            hasEnough = inputUsd <= tokenAvailUsd && inputUsd > 0;
            
            if (currentToken.name === 'Solana') {
                receiveAmt.innerHTML = `${formatMoney(inputUsd)} <i class="ph-bold ph-arrows-down-up" style="color: #666;"></i>`;
            } else {
                const solAmt = solToken.priceUsd ? inputUsd / solToken.priceUsd : 0;
                receiveAmt.innerHTML = `${solAmt.toLocaleString('en-US', {maximumFractionDigits:4})} SOL <i class="ph-bold ph-arrows-down-up" style="color: #666;"></i>`;
            }
        }
        
        if(hasEnough) confirmBtn.classList.add('enabled');
        else confirmBtn.classList.remove('enabled');
    }

    // Quick Percents
    document.querySelectorAll('.pct-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pct = parseFloat(btn.getAttribute('data-pct'));
            let maxUsd = 0;
            if (currentTradeAction === 'buy') {
                maxUsd = currentToken.name === 'Solana' ? parseMoney(appState.cashAmount) : parseMoney(getSolToken().fiatValue);
            } else {
                maxUsd = parseMoney(currentToken.fiatValue);
            }
            tradeInputValue = (maxUsd * pct).toFixed(2);
            updateTradeDisplay();
        });
    });

    // Execute Trade
    document.getElementById('trade-confirm-btn').addEventListener('click', () => {
        const confirmBtn = document.getElementById('trade-confirm-btn');
        if (!confirmBtn.classList.contains('enabled')) return;
        
        const inputUsd = parseFloat(tradeInputValue) || 0;
        const solToken = getSolToken();
        
        if (currentTradeAction === 'buy') {
            const tokenAmtToAdd = inputUsd / currentToken.priceUsd;
            if (currentToken.name === 'Solana') {
                const cash = parseMoney(appState.cashAmount) - inputUsd;
                appState.cashAmount = formatMoney(cash);
                const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                currentToken.amount = `${(currAmt + tokenAmtToAdd).toFixed(4)} ${currentToken.name}`;
            } else {
                const solAmtToDeduct = inputUsd / solToken.priceUsd;
                const currSol = parseFloat(solToken.amount.split(' ')[0]) || 0;
                solToken.amount = `${(currSol - solAmtToDeduct).toFixed(4)} SOL`;
                const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                currentToken.amount = `${(currAmt + tokenAmtToAdd).toFixed(4)} ${currentToken.name}`;
            }
        } else {
            const tokenAmtToDeduct = inputUsd / currentToken.priceUsd;
            const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
            currentToken.amount = `${(currAmt - tokenAmtToDeduct).toFixed(4)} ${currentToken.name}`;
            
            if (currentToken.name === 'Solana') {
                const cash = parseMoney(appState.cashAmount) + inputUsd;
                appState.cashAmount = formatMoney(cash);
            } else {
                const solAmtToAdd = inputUsd / solToken.priceUsd;
                const currSol = parseFloat(solToken.amount.split(' ')[0]) || 0;
                solToken.amount = `${(currSol + solAmtToAdd).toFixed(4)} SOL`;
            }
        }
        
        tradingModal.classList.add('hidden');
        tokenDetailsModal.classList.add('hidden');
        currentToken = null;
        renderApp();
    });

    // Hidden Edit modal trigger
    document.getElementById('explore-btn').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('hidden');
    });
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('hidden');
    });

});
"""

with open("script.js", "w") as f:
    f.write(new_script)
print("Script updated successfully.")
