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

    // Ensure entryInvestment exists
    appState.tokens.forEach(t => {
        if(t.entryInvestment === undefined) t.entryInvestment = '';
        if(t.entryMcap === undefined) t.entryMcap = '';
    });

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
                    // Try to find pair where it's the base token
                    let pair = data.pairs.find(p => p.baseToken.address === token.tokenAddress);
                    if (!pair && token.name === 'Solana') {
                        // Fallback for SOL
                        pair = data.pairs.find(p => p.baseToken.address === 'So11111111111111111111111111111111111111112');
                    }
                    if (pair) {
                        const currentPrice = parseFloat(pair.priceUsd) || 0;
                        token.priceUsd = currentPrice;
                        
                        let currentValue = 0;
                        const change24h = pair.priceChange && pair.priceChange.h24 ? parseFloat(pair.priceChange.h24) : 0;

                        if (token.name === 'Solana' || token.name === 'USDC' || (!token.entryInvestment && !token.entryMcap)) {
                            // Native amount * price
                            const tokenAmount = parseFloat(token.amount.split(' ')[0]) || 0;
                            currentValue = tokenAmount * currentPrice;
                        } else {
                            // Entry logic
                            const currentMcap = pair.marketCap || pair.fdv || 0;
                            if (currentMcap > 0 && token.entryMcap && token.entryInvestment) {
                                const entryInv = parseFloat(token.entryInvestment) || 0;
                                const entryMc = parseFloat(token.entryMcap) || 1;
                                currentValue = entryInv * (currentMcap / entryMc);
                                const tokenAmount = currentValue / currentPrice;
                                token.amount = `${tokenAmount.toLocaleString('en-US', {maximumFractionDigits:4})} ${token.name}`;
                            }
                        }
                        
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
            const parts = tradeInputValue.split('.');
            if(parts.length === 2 && parts[1].length > 2) tradeInputValue = parts[0] + '.' + parts[1].slice(0,2);
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

    document.getElementById('trade-confirm-btn').addEventListener('click', () => {
        const confirmBtn = document.getElementById('trade-confirm-btn');
        if (!confirmBtn.classList.contains('enabled')) return;
        
        const inputUsd = parseFloat(tradeInputValue) || 0;
        const solToken = getSolToken();
        
        if (currentTradeAction === 'buy') {
            if (currentToken.name === 'Solana') {
                const cash = parseMoney(appState.cashAmount) - inputUsd;
                appState.cashAmount = formatMoney(cash);
                const tokenAmtToAdd = inputUsd / currentToken.priceUsd;
                const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                currentToken.amount = `${(currAmt + tokenAmtToAdd).toFixed(4)} ${currentToken.name}`;
            } else {
                const solAmtToDeduct = inputUsd / solToken.priceUsd;
                const currSol = parseFloat(solToken.amount.split(' ')[0]) || 0;
                solToken.amount = `${(currSol - solAmtToDeduct).toFixed(4)} SOL`;
                
                if (currentToken.entryInvestment && currentToken.entryMcap) {
                    const pctOfRemaining = inputUsd / parseMoney(currentToken.fiatValue);
                    const currentInv = parseFloat(currentToken.entryInvestment);
                    currentToken.entryInvestment = (currentInv + (currentInv * pctOfRemaining)).toString();
                } else {
                    const tokenAmtToAdd = inputUsd / currentToken.priceUsd;
                    const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                    currentToken.amount = `${(currAmt + tokenAmtToAdd).toFixed(4)} ${currentToken.name}`;
                }
            }
        } else {
            if (currentToken.name === 'Solana') {
                const cash = parseMoney(appState.cashAmount) + inputUsd;
                appState.cashAmount = formatMoney(cash);
                const tokenAmtToDeduct = inputUsd / currentToken.priceUsd;
                const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                currentToken.amount = `${(currAmt - tokenAmtToDeduct).toFixed(4)} ${currentToken.name}`;
            } else {
                const solAmtToAdd = inputUsd / solToken.priceUsd;
                const currSol = parseFloat(solToken.amount.split(' ')[0]) || 0;
                solToken.amount = `${(currSol + solAmtToAdd).toFixed(4)} SOL`;
                
                if (currentToken.entryInvestment && currentToken.entryMcap) {
                    const currentFiat = parseMoney(currentToken.fiatValue);
                    const pctToSell = inputUsd / currentFiat;
                    const currentInv = parseFloat(currentToken.entryInvestment);
                    currentToken.entryInvestment = (currentInv - (currentInv * pctToSell)).toString();
                } else {
                    const tokenAmtToDeduct = inputUsd / currentToken.priceUsd;
                    const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                    currentToken.amount = `${(currAmt - tokenAmtToDeduct).toFixed(4)} ${currentToken.name}`;
                }
            }
        }
        
        tradingModal.classList.add('hidden');
        tokenDetailsModal.classList.add('hidden');
        currentToken = null;
        renderApp();
    });

    // --- Edit Modal Form Logic ---
    const editForm = document.getElementById('edit-form');
    const fetchTokenBtn = document.getElementById('fetch-token-btn');
    const dexscreenerAddressInput = document.getElementById('dexscreener-address');
    const entryInvestmentInput = document.getElementById('entry-investment');
    const entryMcapInput = document.getElementById('entry-mcap');
    const fetchStatus = document.getElementById('fetch-status');
    const editTokensList = document.getElementById('edit-tokens-list');
    
    document.getElementById('explore-btn').addEventListener('click', () => {
        document.getElementById('edit-handle').value = appState.handle;
        document.getElementById('edit-account-name').value = appState.accountName;
        document.getElementById('edit-main-balance').value = appState.mainBalance;
        document.getElementById('edit-change-amount').value = appState.changeAmount;
        document.getElementById('edit-cash-amount').value = appState.cashAmount;
        renderEditTokens();
        document.getElementById('edit-modal').classList.remove('hidden');
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('hidden');
    });

    function renderEditTokens() {
        if(!editTokensList) return;
        editTokensList.innerHTML = '';
        appState.tokens.forEach((t, i) => {
            editTokensList.insertAdjacentHTML('beforeend', `
                <div style="border: 1px solid #333; padding: 10px; margin-bottom: 10px; border-radius: 8px;">
                    <div class="form-group"><label>Name</label><input type="text" value="${t.name}" onchange="appState.tokens[${i}].name=this.value"></div>
                    <div class="form-group"><label>Amount</label><input type="text" value="${t.amount}" onchange="appState.tokens[${i}].amount=this.value"></div>
                    <div class="form-group"><label>Fiat Value</label><input type="text" value="${t.fiatValue}" onchange="appState.tokens[${i}].fiatValue=this.value"></div>
                    <div class="form-group"><label>Entry Investment</label><input type="text" value="${t.entryInvestment || ''}" onchange="appState.tokens[${i}].entryInvestment=this.value"></div>
                    <div class="form-group"><label>Entry MCAP</label><input type="text" value="${t.entryMcap || ''}" onchange="appState.tokens[${i}].entryMcap=this.value"></div>
                    <button type="button" class="action-btn-small" style="background:var(--accent-red);color:#fff;" onclick="appState.tokens.splice(${i},1); renderEditTokens(); renderApp();">Remove</button>
                </div>
            `);
        });
    }

    if(editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            appState.handle = document.getElementById('edit-handle').value;
            appState.accountName = document.getElementById('edit-account-name').value;
            appState.mainBalance = document.getElementById('edit-main-balance').value;
            appState.changeAmount = document.getElementById('edit-change-amount').value;
            appState.cashAmount = document.getElementById('edit-cash-amount').value;
            saveState();
            renderApp();
            document.getElementById('edit-modal').classList.add('hidden');
        });
    }

    if(fetchTokenBtn) {
        fetchTokenBtn.addEventListener('click', async () => {
            const address = dexscreenerAddressInput.value.trim();
            const invVal = entryInvestmentInput ? parseFloat(entryInvestmentInput.value) : 0;
            const mcVal = entryMcapInput ? parseFloat(entryMcapInput.value) : 0;
            
            if (!address) { alert('Please enter an address'); return; }
            fetchStatus.style.display = 'block';
            fetchStatus.textContent = 'Fetching...';
            try {
                const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
                const data = await res.json();
                if (data && data.pairs && data.pairs.length > 0) {
                    const pair = data.pairs[0];
                    const symbol = pair.baseToken.symbol || 'Unknown';
                    const price = parseFloat(pair.priceUsd) || 0;
                    const logo = pair.info?.imageUrl || 'https://via.placeholder.com/150';
                    
                    // Deduct from SOL immediately if invVal > 0
                    if (invVal > 0) {
                        const solToken = getSolToken();
                        if (solToken && solToken.priceUsd) {
                            const solAmtToDeduct = invVal / solToken.priceUsd;
                            const currSol = parseFloat(solToken.amount.split(' ')[0]) || 0;
                            solToken.amount = `${(currSol - solAmtToDeduct).toFixed(4)} SOL`;
                        }
                    }

                    appState.tokens.push({
                        name: symbol,
                        amount: `0 ${symbol}`,
                        fiatValue: '$0.00',
                        fiatChange: '+0.00%',
                        changeType: 'positive',
                        logo: logo,
                        tokenAddress: address,
                        priceUsd: price,
                        entryInvestment: invVal > 0 ? invVal.toString() : '',
                        entryMcap: mcVal > 0 ? mcVal.toString() : ''
                    });
                    renderEditTokens();
                    dexscreenerAddressInput.value = '';
                    if(entryInvestmentInput) entryInvestmentInput.value = '';
                    if(entryMcapInput) entryMcapInput.value = '';
                    
                    fetchStatus.textContent = 'Added successfully & deducted SOL!';
                    setTimeout(() => fetchStatus.style.display='none', 3000);
                    renderApp();
                } else {
                    fetchStatus.textContent = 'Not found.';
                }
            } catch(e) { fetchStatus.textContent = 'Error.'; }
        });
    }

    document.getElementById('add-token-btn').addEventListener('click', () => {
        appState.tokens.push({ name: 'New Token', amount: '0', fiatValue: '$0.00', fiatChange: '$0.00', changeType: 'neutral', logo: '', tokenAddress: '', priceUsd: 0, entryInvestment: '', entryMcap: '' });
        renderEditTokens();
    });

});
"""

with open("script.js", "w") as f:
    f.write(new_script)
print("Script updated with Entry MCAP and SOL logic.")
