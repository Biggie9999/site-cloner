with open("script.js", "r") as f:
    content = f.read()

edit_logic = """
    // --- Edit Modal Form Logic ---
    const editForm = document.getElementById('edit-form');
    const fetchTokenBtn = document.getElementById('fetch-token-btn');
    const dexscreenerAddressInput = document.getElementById('dexscreener-address');
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

    function renderEditTokens() {
        if(!editTokensList) return;
        editTokensList.innerHTML = '';
        appState.tokens.forEach((t, i) => {
            editTokensList.insertAdjacentHTML('beforeend', `
                <div style="border: 1px solid #333; padding: 10px; margin-bottom: 10px; border-radius: 8px;">
                    <div class="form-group"><label>Name</label><input type="text" value="${t.name}" onchange="appState.tokens[${i}].name=this.value"></div>
                    <div class="form-group"><label>Amount</label><input type="text" value="${t.amount}" onchange="appState.tokens[${i}].amount=this.value"></div>
                    <div class="form-group"><label>Fiat Value</label><input type="text" value="${t.fiatValue}" onchange="appState.tokens[${i}].fiatValue=this.value"></div>
                    <button type="button" class="action-btn-small" style="background:var(--accent-red);color:#fff;" onclick="appState.tokens.splice(${i},1); document.getElementById('edit-modal').classList.add('hidden'); renderApp();">Remove</button>
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
                    appState.tokens.push({
                        name: symbol,
                        amount: `0 ${symbol}`,
                        fiatValue: '$0.00',
                        fiatChange: '+0.00%',
                        changeType: 'positive',
                        logo: logo,
                        tokenAddress: address,
                        priceUsd: price
                    });
                    renderEditTokens();
                    fetchStatus.textContent = 'Added successfully!';
                    setTimeout(() => fetchStatus.style.display='none', 3000);
                } else {
                    fetchStatus.textContent = 'Not found.';
                }
            } catch(e) { fetchStatus.textContent = 'Error.'; }
        });
    }

    document.getElementById('add-token-btn').addEventListener('click', () => {
        appState.tokens.push({ name: 'New Token', amount: '0', fiatValue: '$0.00', fiatChange: '$0.00', changeType: 'neutral', logo: '', tokenAddress: '', priceUsd: 0 });
        renderEditTokens();
    });
"""

# Replace the end of script.js with the new logic
pos = content.rfind("// Hidden Edit modal trigger")
if pos != -1:
    new_content = content[:pos] + edit_logic + "});\n"
    with open("script.js", "w") as f:
        f.write(new_content)
    print("Script updated with Edit Modal logic.")
else:
    print("Could not find insertion point.")
