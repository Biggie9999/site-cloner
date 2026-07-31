with open("script.js", "r") as f:
    content = f.read()

import_logic = """
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
                    token.fiatChange = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
                    token.changeType = change24h >= 0 ? 'positive' : 'negative';
                    
                    totalCurrentDynamicValue += currentValue;
                    const previousValue = currentValue / (1 + (change24h / 100));
                    totalPreviousDynamicValue += previousValue;
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
"""

start_str = "    // --- Live DexScreener Fetching ---"
end_str = "    setInterval(fetchLiveUpdates, 5000);"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + import_logic + "\n" + content[end_idx:]
    with open("script.js", "w") as f:
        f.write(new_content)
    print("Updated script.js successfully")
else:
    print("Could not find insertion points")
