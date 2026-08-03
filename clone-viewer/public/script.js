document.addEventListener('DOMContentLoaded', () => {
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
        ],
        history: [
            { id: 1, type: 'Received', fromTo: 'From 3TZp...crQ3', amount: '+16M Polyma...', date: 'Yesterday', icon: 'ph-arrow-down-left', iconColor: '#0052FF', badgeIcon: 'ph-arrow-down', badgeColor: 'var(--accent-purple)', amountColor: 'var(--accent-green)' },
            { id: 2, type: 'Swapped', fromTo: 'Unknown', amount: '+12.05M PURCH', subAmount: '-50 SOL', date: 'Jul 30, 2026', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', badgeImg: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', amountColor: 'var(--accent-green)' },
            { id: 3, type: 'Sent', fromTo: 'To A5Me...pqWR', amount: '-25M DePIN', date: 'Jul 25, 2026', icon: 'ph-arrow-up-right', iconColor: '#CC0000', badgeIcon: 'ph-paper-plane-right', badgeColor: '#0052FF', amountColor: '#909090' }
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
    window.appState = appState;
    window.renderEditTokens = function() { renderEditTokens(); };
    window.renderApp = function() { renderApp(); };
    window.saveState = function() { saveState(); };

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
        const getChainBadge = (name) => {
            let img = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
            if (name.includes('Ethereum') || name.includes('ETH')) img = 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029';
            else if (name.includes('Polygon')) img = 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=029';
            else if (name.includes('Bitcoin') || name.includes('BTC')) img = 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029';
            
            return `<div style="position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; background: #1B1B1B; display: flex; justify-content: center; align-items: center; padding: 2px;"><img src="${img}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"></div>`;
        };

        appState.tokens.forEach((token, index) => {
            const isNegative = token.fiatChange && token.fiatChange.startsWith('-');
            const changeColor = isNegative ? '#FF5C5C' : '#4ADE80';
            const changeText = isNegative ? token.fiatChange : (token.fiatChange === '$0.00' ? '+$0.00' : `+${token.fiatChange}`);
            
            const tokenHTML = `
                <div class="token-item" data-name="${token.name}" style="background: #1B1B1B; border-radius: 16px; padding: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="position: relative; width: 44px; height: 44px;">
                            <img src="${token.logo}" alt="${token.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: #fff;">
                            ${getChainBadge(token.name)}
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px;">
                            <span style="color: #fff; font-weight: 600; font-size: 16px;">${token.name}</span>
                            <span style="color: #909090; font-size: 13px;">${token.amount}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                        <span style="color: #fff; font-weight: 600; font-size: 16px;">${token.fiatValue}</span>
                        <span style="font-size: 13px; color: ${changeColor};">${changeText}</span>
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

        renderHistory();
        saveState();
    }
    renderApp();

    function renderHistory() {
        const historyContainer = document.getElementById('history-list-container');
        if(!historyContainer) return;
        historyContainer.innerHTML = '';
        
        if(!appState.history || appState.history.length === 0) {
            historyContainer.innerHTML = '<div style="color:#909090; text-align:center; margin-top:24px;">No transactions yet</div>';
            return;
        }

        const groups = {};
        appState.history.forEach(tx => {
            if(!groups[tx.date]) groups[tx.date] = [];
            groups[tx.date].push(tx);
        });

        Object.keys(groups).forEach(date => {
            historyContainer.insertAdjacentHTML('beforeend', `<div style="color: #909090; font-size: 14px; font-weight: 500; margin-bottom: 12px; margin-top: 16px;">${date}</div>`);
            
            groups[date].forEach(tx => {
                let iconHtml = '';
                if(tx.img) {
                    iconHtml = `
                        <div style="position: relative; width: 44px; height: 44px;">
                            <img src="${tx.img}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; opacity: 0.8;">
                            <div style="position: absolute; bottom: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%; background: #222; display: flex; justify-content: center; align-items: center;"><img src="${tx.badgeImg || tx.img}" style="width:16px; height:16px; border-radius: 50%;"></div>
                        </div>
                    `;
                } else {
                    iconHtml = `
                        <div style="position: relative; width: 44px; height: 44px;">
                            <div style="width: 44px; height: 44px; border-radius: 50%; background: ${tx.iconColor}; display: flex; justify-content: center; align-items: center;"><i class="ph-bold ${tx.icon}" style="color: #fff; font-size: 20px;"></i></div>
                            <div style="position: absolute; bottom: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%; background: ${tx.badgeColor}; display: flex; justify-content: center; align-items: center;"><i class="ph-bold ${tx.badgeIcon}" style="color: #fff; font-size: 12px;"></i></div>
                        </div>
                    `;
                }

                let amountHtml = '';
                if(tx.subAmount) {
                    amountHtml = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end;">
                            <div style="color: ${tx.amountColor}; font-weight: 600; font-size: 15px;">${tx.amount}</div>
                            <div style="color: #909090; font-size: 14px;">${tx.subAmount}</div>
                        </div>
                    `;
                } else {
                    amountHtml = `<div style="color: ${tx.amountColor}; font-weight: 600; font-size: 15px;">${tx.amount}</div>`;
                }

                historyContainer.insertAdjacentHTML('beforeend', `
                    <div style="background: #1B1B1B; border-radius: 16px; padding: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${iconHtml}
                            <div>
                                <div style="color: #fff; font-weight: 600; font-size: 16px;">${tx.type}</div>
                                <div style="color: #909090; font-size: 14px;">${tx.fromTo}</div>
                            </div>
                        </div>
                        ${amountHtml}
                    </div>
                `);
            });
        });
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        if(!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 400);
        }, 3000);
    }

    // --- Live DexScreener Fetching ---
    async function fetchLiveUpdates() {
        const addresses = appState.tokens.filter(t => t.name !== 'Solana' && t.name !== 'USDC').map(t => t.tokenAddress).filter(addr => addr);
        try {
            let dexData = null;
            if (addresses.length > 0) {
                const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses.join(',')}`);
                dexData = await response.json();
            }
            
            const cgResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd&include_24hr_change=true`);
            const cgData = await cgResponse.json();

            let totalCurrentDynamicValue = 0;
            let totalPreviousDynamicValue = 0;
            let hasUpdates = false;

            appState.tokens.forEach(token => {
                let currentPrice = token.priceUsd;
                let change24h = 0;
                let foundUpdate = false;

                if (token.name === 'Solana' && cgData.solana) {
                    currentPrice = cgData.solana.usd;
                    change24h = cgData.solana.usd_24h_change || 0;
                    foundUpdate = true;
                } else if (token.name === 'USDC' && cgData['usd-coin']) {
                    currentPrice = cgData['usd-coin'].usd;
                    change24h = cgData['usd-coin'].usd_24h_change || 0;
                    foundUpdate = true;
                } else if (dexData && dexData.pairs) {
                    const pair = dexData.pairs.find(p => p.baseToken.address === token.tokenAddress);
                    if (pair) {
                        currentPrice = parseFloat(pair.priceUsd) || 0;
                        change24h = pair.priceChange && pair.priceChange.h24 ? parseFloat(pair.priceChange.h24) : 0;
                        foundUpdate = true;
                    }
                }

                if (foundUpdate) {
                    token.priceUsd = currentPrice;
                    let currentValue = 0;

                    if (token.name === 'Solana' || token.name === 'USDC' || (!token.entryInvestment && !token.entryMcap)) {
                        const tokenAmount = parseFloat(token.amount.split(' ')[0]) || 0;
                        currentValue = tokenAmount * currentPrice;
                    } else {
                        const currentMcap = currentPrice * 1000000000; // rough fallback if no pair mcap exists
                        let actualMcap = currentMcap;
                        if (dexData && dexData.pairs) {
                            const pair = dexData.pairs.find(p => p.baseToken.address === token.tokenAddress);
                            if (pair && (pair.marketCap || pair.fdv)) {
                                actualMcap = pair.marketCap || pair.fdv;
                            }
                        }
                        
                        if (actualMcap > 0 && token.entryMcap && token.entryInvestment) {
                            const entryInv = parseFloat(token.entryInvestment) || 0;
                            const entryMc = parseFloat(token.entryMcap) || 1;
                            currentValue = entryInv * (actualMcap / entryMc);
                            const tokenAmount = currentValue / currentPrice;
                            token.amount = `${tokenAmount.toLocaleString('en-US', {maximumFractionDigits:4})} ${token.name}`;
                        }
                    }
                    
                    token.fiatValue = formatMoney(currentValue);
                    
                    totalCurrentDynamicValue += currentValue;
                    const previousValue = currentValue / (1 + (change24h / 100));
                    totalPreviousDynamicValue += previousValue;
                    
                    const dollarChange = currentValue - previousValue;
                    token.fiatChange = `${dollarChange >= 0 ? '+' : '-'}${formatMoney(Math.abs(dollarChange))}`;
                    token.changeType = dollarChange >= 0 ? 'positive' : 'negative';
                    hasUpdates = true;
                }
            });

            if (hasUpdates) {
                if (totalPreviousDynamicValue > 0) {
                    const dollarChange = totalCurrentDynamicValue - totalPreviousDynamicValue;
                    appState.changeAmount = `${dollarChange >= 0 ? '+' : '-'}${formatMoney(Math.abs(dollarChange))}`;
                }
                renderApp();
                if(!tokenDetailsModal.classList.contains('hidden') && currentToken) {
                    openTokenDetails(currentToken);
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

        // Add to history
        if (!appState.history) appState.history = [];
        appState.history.unshift({
            id: Date.now(),
            type: 'Swapped',
            fromTo: 'Jupiter DEX',
            amount: currentTradeAction === 'buy' ? `+${(inputUsd / currentToken.priceUsd).toFixed(2)} ${currentToken.name}` : `+${(inputUsd / solToken.priceUsd).toFixed(2)} SOL`,
            subAmount: currentTradeAction === 'buy' ? `-$${inputUsd.toFixed(2)}` : `-${(inputUsd / currentToken.priceUsd).toFixed(2)} ${currentToken.name}`,
            date: 'Today',
            img: currentTradeAction === 'buy' ? currentToken.logo : solToken.logo,
            badgeImg: currentTradeAction === 'buy' ? solToken.logo : currentToken.logo,
            amountColor: 'var(--accent-green)'
        });

        currentToken = null;

        // Synchronously update fiat values for instant UI feedback
        if (solToken && solToken.priceUsd) {
            const currentSolAmt = parseFloat(solToken.amount.split(' ')[0]) || 0;
            solToken.fiatValue = formatMoney(currentSolAmt * solToken.priceUsd);
        }
        if (currentToken && currentToken.priceUsd && currentToken.name !== 'Solana') {
            if (currentToken.entryInvestment && currentToken.entryMcap) {
                // If using entry investment logic, we adjust fiatValue based on the new entry investment
                const currentFiat = parseMoney(currentToken.fiatValue);
                if (currentTradeAction === 'sell') {
                    currentToken.fiatValue = formatMoney(currentFiat - inputUsd);
                } else {
                    currentToken.fiatValue = formatMoney(currentFiat + inputUsd);
                }
            } else {
                const currentAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
                currentToken.fiatValue = formatMoney(currentAmt * currentToken.priceUsd);
            }
        }

        saveState();
        renderApp();
        showToast('Swap Successful!');
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
                    <div class="form-group"><label>Name</label><input type="text" value="${t.name}" oninput="appState.tokens[${i}].name=this.value"></div>
                    <div class="form-group"><label>Amount</label><input type="text" value="${t.amount}" oninput="appState.tokens[${i}].amount=this.value"></div>
                    <div class="form-group"><label>Fiat Value</label><input type="text" value="${t.fiatValue}" oninput="appState.tokens[${i}].fiatValue=this.value"></div>
                    <div class="form-group"><label>Entry Investment</label><input type="text" value="${t.entryInvestment || ''}" oninput="appState.tokens[${i}].entryInvestment=this.value"></div>
                    <div class="form-group"><label>Entry MCAP</label><input type="text" value="${t.entryMcap || ''}" oninput="appState.tokens[${i}].entryMcap=this.value"></div>
                    <button type="button" class="action-btn-small" style="background:var(--accent-red);color:#fff;" onclick="appState.tokens.splice(${i},1); saveState(); renderEditTokens(); renderApp();">Remove</button>
                </div>
            `);
        });
    }

    if(editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            appState.handle = document.getElementById('edit-handle').value;
            appState.accountName = document.getElementById('edit-account-name').value;
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

    // --- NEW UI FLOWS LOGIC ---
    let currentFlow = null; // 'send', 'receive', 'buy'
    
    // Modals
    const actionMenuModal = document.getElementById('action-menu-modal');
    const selectTokenModal = document.getElementById('select-token-modal');
    const sendAddressModal = document.getElementById('send-address-modal');
    const sendAmountModal = document.getElementById('send-amount-modal');
    const receiveModal = document.getElementById('receive-modal');
    const sideMenuDrawer = document.getElementById('side-menu-drawer');
    const historyModal = document.getElementById('history-modal');
    const accountsModal = document.getElementById('accounts-modal');

    // Bottom Nav Plus Button
    const addBtn = document.querySelector('.add-btn');
    if(addBtn) {
        addBtn.addEventListener('click', () => {
            actionMenuModal.classList.remove('hidden');
        });
    }

    // Close buttons
    document.getElementById('close-action-menu').addEventListener('click', () => actionMenuModal.classList.add('hidden'));
    document.querySelector('.close-select-token').addEventListener('click', () => selectTokenModal.classList.add('hidden'));
    document.querySelector('.close-send-address').addEventListener('click', () => sendAddressModal.classList.add('hidden'));
    document.querySelector('.close-send-amount').addEventListener('click', () => sendAmountModal.classList.add('hidden'));
    document.querySelector('.close-receive').addEventListener('click', () => receiveModal.classList.add('hidden'));

    // Side Menu, History, Accounts logic
    const profileIconBtn = document.querySelector('.profile-icon');
    if(profileIconBtn) {
        profileIconBtn.addEventListener('click', () => sideMenuDrawer.classList.remove('hidden'));
    }
    
    // Close side menu if clicked outside content
    sideMenuDrawer.addEventListener('click', (e) => {
        if(e.target === sideMenuDrawer) sideMenuDrawer.classList.add('hidden');
    });

    document.getElementById('open-history-btn').addEventListener('click', () => {
        sideMenuDrawer.classList.add('hidden');
        historyModal.classList.remove('hidden');
    });
    
    document.querySelector('.close-history-modal').addEventListener('click', () => historyModal.classList.add('hidden'));

    const openAccountsBtns = document.querySelectorAll('.account-selector, .open-accounts-modal-btn');
    openAccountsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sideMenuDrawer.classList.add('hidden');
            accountsModal.classList.remove('hidden');
        });
    });

    document.querySelector('.close-accounts-modal').addEventListener('click', () => accountsModal.classList.add('hidden'));

    const settingsModal = document.getElementById('settings-modal');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    if(openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            sideMenuDrawer.classList.add('hidden');
            settingsModal.classList.remove('hidden');
        });
    }
    document.querySelector('.close-settings-modal').addEventListener('click', () => settingsModal.classList.add('hidden'));

    const receiveCopyBtn = document.getElementById('receive-copy-btn');
    if(receiveCopyBtn) {
        receiveCopyBtn.addEventListener('click', () => {
            showToast('Address Copied!');
        });
    }

    // Action Grid Buttons
    document.querySelectorAll('.action-grid-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            if (action === 'receive' || action === 'send') {
                currentFlow = action;
                populateSelectToken();
                selectTokenModal.classList.remove('hidden');
            } else if (action === 'buy') { // Swap
                currentToken = appState.tokens.find(t => t.name === 'Solana');
                openTrading('buy');
            } else if (action === 'buy-fiat') { // Buy
                document.getElementById('fiat-onramp-modal').classList.remove('hidden');
            }
        });
    });

    // Bottom Tabs
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            // Reset colors
            document.querySelectorAll('.tab-item').forEach(t => {
                t.classList.remove('active');
                t.style.color = '#666';
            });
            tab.classList.add('active');
            tab.style.color = 'var(--accent-purple)';
            
            if (tab.classList.contains('activity-tab')) {
                document.getElementById('history-modal').classList.remove('hidden');
                // Reset active tab back to Home visually when closing history is handled elsewhere, or just let it be
            } else if (tab.classList.contains('swap-tab')) {
                currentToken = appState.tokens.find(t => t.name === 'Solana');
                openTrading('buy');
            } else if (tab.classList.contains('browser-tab')) {
                showToast('Browser coming soon!');
            }
        });
    });

    function populateSelectToken() {
        const list = document.getElementById('select-token-list');
        list.innerHTML = '';
        appState.tokens.forEach(token => {
            list.insertAdjacentHTML('beforeend', `
                <div class="select-token-item" data-name="${token.name}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #1B1B1B; border-radius: 16px; cursor: pointer; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${token.logo}" style="width: 40px; height: 40px; border-radius: 50%;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="color: #fff; font-weight: 600; font-size: 16px;">${token.name}</span>
                            <span style="color: #909090; font-size: 14px;">${token.amount}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <span style="color: #fff; font-weight: 600; font-size: 16px;">${token.fiatValue}</span>
                    </div>
                </div>
            `);
        });

        document.querySelectorAll('.select-token-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.getAttribute('data-name');
                const selected = appState.tokens.find(t => t.name === name);
                currentToken = selected;
                selectTokenModal.classList.add('hidden');
                
                if (currentFlow === 'send') {
                    document.getElementById('send-address-title').textContent = currentToken.name;
                    sendAddressModal.classList.remove('hidden');
                } else if (currentFlow === 'receive') {
                    document.getElementById('receive-title').textContent = `Receive any ${currentToken.name} token`;
                    document.getElementById('receive-token-name').textContent = currentToken.name;
                    document.getElementById('receive-qr-logo').src = currentToken.logo;
                    receiveModal.classList.remove('hidden');
                }
            });
        });
    }

    // Fiat On-Ramp Logic
    const fiatOnrampModal = document.getElementById('fiat-onramp-modal');
    document.querySelector('.close-fiat-modal').addEventListener('click', () => fiatOnrampModal.classList.add('hidden'));
    
    document.querySelectorAll('.fiat-provider-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            fiatOnrampModal.classList.add('hidden');
            showToast('Redirecting to provider...');
        });
    });

    // Send Address Next
    const sendAddressNext = document.getElementById('send-address-next');
    const sendAddressInput = document.getElementById('send-address-input');
    
    sendAddressInput.addEventListener('input', () => {
        if(sendAddressInput.value.length > 0) {
            sendAddressNext.style.color = 'var(--accent-purple)';
        } else {
            sendAddressNext.style.color = '#666';
        }
    });

    sendAddressNext.addEventListener('click', () => {
        if(sendAddressInput.value.length === 0) return;
        sendAddressModal.classList.add('hidden');
        document.getElementById('send-amount-to-address').textContent = sendAddressInput.value;
        document.getElementById('send-amount-token-symbol').textContent = currentToken.name === 'Solana' ? 'SOL' : currentToken.name;
        document.getElementById('send-amount-available').textContent = currentToken.amount;
        
        sendAmountInputValue = "0";
        updateSendAmountDisplay();
        sendAmountModal.classList.remove('hidden');
    });

    const sendConfirmBtn = document.getElementById('send-confirm-btn');
    if(sendConfirmBtn) {
        sendConfirmBtn.addEventListener('click', () => {
            const numAmt = parseFloat(sendAmountInputValue) || 0;
            if (numAmt <= 0) return;

            // Deduct balance
            const currAmt = parseFloat(currentToken.amount.split(' ')[0]) || 0;
            if (currAmt >= numAmt) {
                currentToken.amount = `${(currAmt - numAmt).toFixed(4)} ${currentToken.name}`;
                if (currentToken.priceUsd) {
                    const currentFiat = parseMoney(currentToken.fiatValue);
                    currentToken.fiatValue = formatMoney(currentFiat - (numAmt * currentToken.priceUsd));
                }
                
                // Add to history
                if (!appState.history) appState.history = [];
                appState.history.unshift({
                    id: Date.now(),
                    type: 'Sent',
                    fromTo: `To ${document.getElementById('send-address-input').value.substring(0,6)}...`,
                    amount: `-${numAmt} ${currentToken.name === 'Solana' ? 'SOL' : currentToken.name}`,
                    date: 'Today',
                    icon: 'ph-arrow-up-right',
                    iconColor: '#CC0000',
                    badgeIcon: 'ph-paper-plane-right',
                    badgeColor: '#0052FF',
                    amountColor: '#fff'
                });

                sendAmountModal.classList.add('hidden');
                saveState();
                renderApp();
                showToast('Transaction Sent!');
            } else {
                showToast('Insufficient Balance');
            }
        });
    }

    // Send Amount Keypad Logic
    let sendAmountInputValue = "0";
    const sendKeypadLayout = [
        {k:'1', sub:''}, {k:'2', sub:'A B C'}, {k:'3', sub:'D E F'},
        {k:'4', sub:'G H I'}, {k:'5', sub:'J K L'}, {k:'6', sub:'M N O'},
        {k:'7', sub:'P Q R S'}, {k:'8', sub:'T U V'}, {k:'9', sub:'W X Y Z'},
        {k:'.', sub:''}, {k:'0', sub:''}, {k:'DEL', sub:''}
    ];
    const sendKeypadContainer = document.getElementById('send-amount-keypad');
    if(sendKeypadContainer) {
        sendKeypadContainer.innerHTML = '';
        sendKeypadLayout.forEach(item => {
            const btn = document.createElement('button');
            if(item.k === 'DEL') {
                btn.innerHTML = '<i class="ph-bold ph-backspace"></i>';
            } else {
                btn.innerHTML = `${item.k} ${item.sub ? `<span>${item.sub}</span>` : ''}`;
            }
            
            btn.addEventListener('click', () => {
                if(item.k === 'DEL') {
                    sendAmountInputValue = sendAmountInputValue.slice(0, -1);
                    if(sendAmountInputValue === "") sendAmountInputValue = "0";
                } else if(item.k === '.') {
                    if(!sendAmountInputValue.includes('.')) sendAmountInputValue += '.';
                } else {
                    if(sendAmountInputValue === "0") sendAmountInputValue = item.k;
                    else sendAmountInputValue += item.k;
                }
                const parts = sendAmountInputValue.split('.');
                if(parts.length === 2 && parts[1].length > 4) sendAmountInputValue = parts[0] + '.' + parts[1].slice(0,4);
                updateSendAmountDisplay();
            });
            sendKeypadContainer.appendChild(btn);
        });
    }

    function updateSendAmountDisplay() {
        document.getElementById('send-amount-input-display').textContent = sendAmountInputValue;
        const numAmt = parseFloat(sendAmountInputValue) || 0;
        if(currentToken && currentToken.priceUsd) {
            const fiat = numAmt * currentToken.priceUsd;
            document.getElementById('send-amount-fiat-display').textContent = `~${formatMoney(fiat)}`;
        } else {
            document.getElementById('send-amount-fiat-display').textContent = `~$0.00`;
        }
    }

});

    const closeHistoryBtn = document.querySelector(".close-history-modal");
    if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", () => historyModal.classList.add("hidden"));
    
    const closeCollectiblesBtn = document.querySelector(".close-collectibles-modal");
    if (closeCollectiblesBtn) closeCollectiblesBtn.addEventListener("click", () => collectiblesModal.classList.add("hidden"));
    
    const closeBrowserBtn = document.querySelector(".close-browser-modal");
    if (closeBrowserBtn) closeBrowserBtn.addEventListener("click", () => browserModal.classList.add("hidden"));

    const profileIconBtn = document.querySelector(".profile-icon");
    if(profileIconBtn) {
        profileIconBtn.addEventListener("click", () => sideMenuDrawer.classList.remove("hidden"));
    }
    
    sideMenuDrawer.addEventListener("click", (e) => {
        if(e.target === sideMenuDrawer) sideMenuDrawer.classList.add("hidden");
    });
    
    const sideMenuItems = document.querySelectorAll(".side-menu-item");
    sideMenuItems.forEach(item => {
        item.addEventListener("click", () => {
            const label = item.querySelector("span").textContent;
            if(label === "Settings") {
                document.getElementById("settings-modal").classList.remove("hidden");
            } else {
                showToast(label + " - Coming Soon");
            }
        });
    });

    document.getElementById("close-accounts-modal").addEventListener("click", () => accountsModal.classList.add("hidden"));

    const openActionMenuBtn = document.querySelector(".open-action-menu-btn");
    if (openActionMenuBtn) {
        openActionMenuBtn.addEventListener("click", () => {
            actionMenuModal.classList.remove("hidden");
        });
    }

    const settingsModal = document.getElementById("settings-modal");
    const openSettingsBtn = document.getElementById("open-settings-btn");
    if(openSettingsBtn) {
        openSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
    }
    const closeSettingsBtn = document.getElementById("close-settings-modal");
    if(closeSettingsBtn) {
        closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
    }

    const receiveCopyBtn = document.getElementById("receive-copy-btn");
    if(receiveCopyBtn) {
        receiveCopyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(currentReceiveAddress).then(() => {
                showToast("Address Copied!");
            }).catch(err => {
                console.error("Failed to copy: ", err);
                showToast("Address Copied!");
            });
        });
    }

    document.querySelectorAll(".action-grid-btn, .action-menu-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            if(actionMenuModal) actionMenuModal.classList.add("hidden");
            
            if (action === "receive" || action === "send") {
                currentFlow = action;
                populateSelectToken();
                selectTokenModal.classList.remove("hidden");
            } else if (action === "buy") { // Swap
                currentToken = appState.tokens.find(t => t.name === "Solana");
                if (!currentToken) { alert("You need Solana in your wallet to swap."); return; }
                openTrading("buy");
            } else if (action === "buy-fiat") { // Buy
                showToast("Coming Soon");
            }
        });
    });

    document.querySelectorAll(".scan-qr-btn, .search-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            showToast("Coming Soon");
        });
    });

    document.querySelectorAll(".tab-item").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab-item").forEach(t => {
                t.classList.remove("active");
                t.style.color = "#666";
            });
            tab.classList.add("active");
            tab.style.color = "var(--accent-purple)";
            
            historyModal.classList.add("hidden");
            collectiblesModal.classList.add("hidden");
            browserModal.classList.add("hidden");
            
            const allModals = [
                "accounts-modal", "settings-modal", "side-menu-drawer", 
                "receive-modal", "send-amount-modal", "fiat-onramp-modal", 
                "token-details-modal", "edit-modal", "trading-modal"
            ];
            allModals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal) modal.classList.add("hidden");
            });
            
            if (tab.classList.contains("activity-tab")) {
                historyModal.classList.remove("hidden");
            } else if (tab.classList.contains("swap-tab")) {
                currentToken = appState.tokens.find(t => t.name && t.name.toLowerCase() === "solana") || appState.tokens[0];
                if (!currentToken) {
                    alert("You need at least one token to swap.");
                    return;
                }
                openTrading("buy");
            } else if (tab.classList.contains("browser-tab")) {
                browserModal.classList.remove("hidden");
            } else if (tab.classList.contains("ph-squares-four") || tab.querySelector(".ph-squares-four")) {
                collectiblesModal.classList.remove("hidden");
            }
        });
    });

    const browserInput = document.getElementById("browser-input");
    const browserContent = document.getElementById("browser-content");
    
    if (browserInput) {
        browserInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                let url = browserInput.value.trim();
                if (!url) return;
                
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    if (url.includes(".")) {
                        url = "https://" + url;
                    } else {
                        url = "https://www.google.com/search?q=" + encodeURIComponent(url);
                    }
                }
                
                browserContent.innerHTML = "";
                browserContent.style.padding = "0"; 
                browserContent.style.background = "#fff"; 
                
                const iframe = document.createElement("iframe");
                iframe.src = url;
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
                
                browserContent.appendChild(iframe);
            }
        });
    }

    function populateSelectToken() {
        const list = document.getElementById("select-token-list");
        list.innerHTML = "";
        
        appState.tokens.forEach(token => {
            list.insertAdjacentHTML("beforeend", `
                <div class="select-token-item" data-name="${token.name}" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #252525; display: flex; align-items: center; justify-content: center;">
                            ${token.logo ? `<img src="${token.logo}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="ph-fill ph-coin" style="color:var(--accent-purple); font-size:20px;"></i>`}
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="color: #fff; font-weight: 600; font-size: 16px;">${token.name}</span>
                            <span style="color: #909090; font-size: 14px;">${token.amount}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <span style="color: #fff; font-weight: 600; font-size: 16px;">${token.fiatValue}</span>
                    </div>
                </div>
            `);
        });
        
        document.querySelectorAll(".select-token-item").forEach(item => {
            item.addEventListener("click", () => {
                const name = item.getAttribute("data-name");
                const selected = appState.tokens.find(t => t.name === name);
                currentToken = selected;
                selectTokenModal.classList.add("hidden");
                
                if (currentFlow === "send") {
                    sendAddressModal.classList.remove("hidden");
                } else if (currentFlow === "receive") {
                    document.getElementById("receive-title").textContent = `Receive any ${currentToken.name} token`;
                    document.getElementById("receive-token-name").textContent = currentToken.name;
                    document.getElementById("receive-qr-logo").src = currentToken.logo;
                    
                    const safeName = currentToken.name || "";
                    const safeSymbol = currentToken.symbol || "";
                    
                    if (safeName.toLowerCase().includes("bitcoin") || safeSymbol.toLowerCase() === "btc") {
                        currentReceiveAddress = "bc1qadhjl7ym27y64x6ffg3zvre3nygga3h62ny367";
                    } else if (
                        safeName.toLowerCase().includes("ethereum") || safeSymbol.toLowerCase() === "eth" || 
                        safeName.toLowerCase().includes("tether") || safeSymbol.toLowerCase() === "usdt" || 
                        safeName.toLowerCase().includes("usd") || safeSymbol.toLowerCase() === "usdc"
                    ) {
                        currentReceiveAddress = "0x8E1E556488d5eF7A2bEA1d2557551DBbDBf2A703";
                    } else {
                        currentReceiveAddress = "So11111111111111111111111111111111111111112";
                    }
                    
                    const p1 = currentReceiveAddress.substring(0, 4);
                    const p2 = currentReceiveAddress.substring(currentReceiveAddress.length - 4);
                    document.getElementById("receive-address-display").textContent = `${p1}...${p2}`;
                    
                    receiveModal.classList.remove("hidden");
                }
            });
        });
    }

    let currentReceiveAddress = "So11111111111111111111111111111111111111112";

    const sendAddressInput = document.getElementById("send-address-input");
    const sendAddressNextBtn = document.getElementById("send-address-next-btn");

    if(sendAddressInput && sendAddressNextBtn) {
        sendAddressInput.addEventListener("input", (e) => {
            if(e.target.value.trim().length > 0) {
                sendAddressNextBtn.style.opacity = "1";
                sendAddressNextBtn.style.pointerEvents = "auto";
            } else {
                sendAddressNextBtn.style.opacity = "0.5";
                sendAddressNextBtn.style.pointerEvents = "none";
            }
        });

        sendAddressNextBtn.addEventListener("click", () => {
            sendAddressModal.classList.add("hidden");
            sendAmountInputValue = "0";
            updateSendAmountDisplay();
            
            document.getElementById("send-amount-token-logo").src = currentToken.logo;
            document.getElementById("send-amount-token-symbol").textContent = currentToken.name;
            
            const tokenAmt = parseFloat(currentToken.amount.split(" ")[0]) || 0;
            document.getElementById("send-amount-available").textContent = `${tokenAmt.toLocaleString("en-US", {maximumFractionDigits:4})} ${currentToken.name} available`;
            
            sendAmountModal.classList.remove("hidden");
        });
    }

    let sendAmountInputValue = "0";
    const sendAmountNextBtn = document.getElementById("send-amount-next-btn");
    
    document.querySelectorAll(".send-key").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.getAttribute("data-key");
            
            if (key === "delete") {
                if (sendAmountInputValue.length > 1) {
                    sendAmountInputValue = sendAmountInputValue.slice(0, -1);
                } else {
                    sendAmountInputValue = "0";
                }
            } else if (key === ".") {
                if (!sendAmountInputValue.includes(".")) {
                    sendAmountInputValue += ".";
                }
            } else {
                if (sendAmountInputValue === "0" && key !== ".") {
                    sendAmountInputValue = key;
                } else {
                    sendAmountInputValue += key;
                }
            }
            updateSendAmountDisplay();
            
            const numAmt = parseFloat(sendAmountInputValue) || 0;
            const tokenAmt = parseFloat(currentToken.amount.split(" ")[0]) || 0;
            
            if (numAmt > 0 && numAmt <= tokenAmt) {
                sendAmountNextBtn.style.opacity = "1";
                sendAmountNextBtn.style.pointerEvents = "auto";
            } else {
                sendAmountNextBtn.style.opacity = "0.5";
                sendAmountNextBtn.style.pointerEvents = "none";
            }
        });
    });
    
    if (sendAmountNextBtn) {
        sendAmountNextBtn.addEventListener("click", () => {
            sendAmountModal.classList.add("hidden");
            const numAmt = parseFloat(sendAmountInputValue) || 0;
            
            const tokenAmt = parseFloat(currentToken.amount.split(" ")[0]) || 0;
            currentToken.amount = `${(tokenAmt - numAmt).toFixed(4)} ${currentToken.name}`;
            
            if (currentToken.priceUsd) {
                const newFiat = (tokenAmt - numAmt) * currentToken.priceUsd;
                currentToken.fiatValue = formatMoney(newFiat);
            }
            
            if (!appState.history) appState.history = [];
            const fiatVal = currentToken.priceUsd ? numAmt * currentToken.priceUsd : 0;
            appState.history.unshift({
                id: Date.now(),
                type: "Sent",
                fromTo: "To " + sendAddressInput.value.substring(0,4) + "..." + sendAddressInput.value.substring(sendAddressInput.value.length-4),
                amount: `-${numAmt.toFixed(4)} ${currentToken.name}`,
                subAmount: formatMoney(fiatVal),
                date: "Just now",
                icon: "ph-arrow-up-right",
                iconColor: "#CC0000",
                badgeIcon: "ph-paper-plane-right",
                badgeColor: "#0052FF",
                amountColor: "#909090",
                img: currentToken.logo
            });
            
            saveState();
            renderApp();
            showToast("Transaction Sent!");
        });
    }

    function updateSendAmountDisplay() {
        document.getElementById("send-amount-input-display").textContent = sendAmountInputValue;
        const numAmt = parseFloat(sendAmountInputValue) || 0;
        if(currentToken && currentToken.priceUsd) {
            const fiat = numAmt * currentToken.priceUsd;
            document.getElementById("send-amount-fiat-display").textContent = `~${formatMoney(fiat)}`;
        } else {
            document.getElementById("send-amount-fiat-display").textContent = `~$0.00`;
        }
    }

