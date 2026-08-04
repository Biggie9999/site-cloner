"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Forms state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [tokens, setTokens] = useState([]);
  const [history, setHistory] = useState([]);
  const [txnStatus, setTxnStatus] = useState('');

  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminInput, setAdminInput] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminInput === 'admin123') {
      setIsAdminAuthed(true);
    } else {
      alert('Incorrect password');
      setAdminInput('');
    }
  };

  useEffect(() => {
    // Check auth before loading
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setIsAuthed(true);
      loadProfiles();
    };
    checkAuth();
  }, []);

  async function loadProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
  };

  const loadUserData = async (userId) => {
    const { data: tData } = await supabase.from('tokens').select('*').eq('user_id', userId);
    if (tData) setTokens(tData);
    
    const { data: hData } = await supabase.from('history').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (hData) setHistory(hData);

    // Refresh profile data too
    const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (pData) {
      setSelectedUser(pData);
      setProfiles(prev => prev.map(p => p.id === userId ? pData : p));
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    loadUserData(user.id);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
    });
    if (error) alert(error.message);
    else {
      alert('User created!');
      setNewEmail('');
      setNewPassword('');
      loadProfiles();
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update({
      handle: selectedUser.handle,
      account_name: selectedUser.account_name,
      cash_amount: selectedUser.cash_amount
    }).eq('id', selectedUser.id);
    if (error) alert(error.message);
    else alert('Profile updated!');
  };

  const handleAddToken = async (e) => {
    e.preventDefault();
    const name = e.target.tokenName.value;
    const symbol = e.target.symbol.value;
    const balance = e.target.balance.value;
    const fiat_value = e.target.fiat_value.value;
    const icon_url = e.target.icon_url?.value || '';
    const fiat_price = e.target.fiat_price?.value || '$0.00';
    const entry_investment = e.target.entry_investment?.value || null;
    const entry_mcap = e.target.entry_mcap?.value || null;
    const token_address = e.target.token_address?.value || '';
    
    const { error } = await supabase.from('tokens').insert([{
      user_id: selectedUser.id,
      name, symbol, balance, fiat_value, icon_url, fiat_price, entry_investment, entry_mcap, token_address
    }]);
    if (error) alert(error.message);
    else {
      alert('Token added!');
      e.target.reset();
      loadUserData(selectedUser.id);
    }
  };

  const handleDeleteToken = async (tokenId) => {
    if (!confirm('Delete this token?')) return;
    await supabase.from('tokens').delete().eq('id', tokenId);
    loadUserData(selectedUser.id);
  };

  const handleDeleteHistory = async (historyId) => {
    if (!confirm('Delete this history record?')) return;
    await supabase.from('history').delete().eq('id', historyId);
    loadUserData(selectedUser.id);
  };

  const handleInjectTxn = async (e) => {
    e.preventDefault();
    setTxnStatus('Processing...');
    
    const type = e.target.txnType.value; // Received or Sent
    const amount = e.target.txnAmount.value;
    const preset = e.target.txnPreset.value;
    const contractAddress = preset === 'custom' ? e.target.txnCA.value.trim() : preset;
    
    if (!contractAddress) {
      setTxnStatus('❌ Please enter a Contract Address');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTxnStatus('❌ Please enter a valid amount');
      return;
    }

    // Fetch token info from DexScreener
    let fetchedSymbol = '';
    let fetchedName = '';
    let fetchedPrice = 0;
    let fetchedIcon = '';

    const predefinedTokens = {
      'SOL': { id: 'solana', symbol: 'SOL', name: 'Solana', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
      'SO11111111111111111111111111111111111111112': { id: 'solana', symbol: 'SOL', name: 'Solana', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
      'USDC': { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029' },
      'USDT': { id: 'tether', symbol: 'USDT', name: 'Tether', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=029' },
      'ETH': { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029' },
      'BTC': { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029' }
    };

    const presetKey = contractAddress.toUpperCase();

    if (predefinedTokens[presetKey]) {
      const p = predefinedTokens[presetKey];
      fetchedSymbol = p.symbol;
      fetchedName = p.name;
      fetchedIcon = p.icon;
      try {
        const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${p.id}&vs_currencies=usd`);
        const cgData = await cgRes.json();
        fetchedPrice = cgData[p.id]?.usd || 0;
      } catch(e) { console.error(e); }
    } else {
      // DexScreener lookup
      setTxnStatus('Fetching token info from DexScreener...');
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
        const data = await res.json();
        if (data && data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          fetchedSymbol = pair.baseToken.symbol;
          fetchedName = pair.baseToken.name;
          fetchedPrice = parseFloat(pair.priceUsd) || 0;
          fetchedIcon = pair.info?.imageUrl || '';
        } else {
          setTxnStatus('❌ Token not found on DexScreener. Check the CA.');
          return;
        }
      } catch (err) {
        setTxnStatus('❌ DexScreener fetch failed: ' + err.message);
        return;
      }
    }

    setTxnStatus(`Found ${fetchedName} (${fetchedSymbol}) at $${fetchedPrice.toFixed(6)}. Updating...`);

    const multiplier = type === 'Sent' ? -1 : 1;
    const amountChange = parsedAmount * multiplier;
    const fiatChange = amountChange * fetchedPrice;

    // Check if user already has this token
    const existingToken = tokens.find(t => 
      t.symbol?.toLowerCase() === fetchedSymbol.toLowerCase() ||
      t.token_address?.toLowerCase() === contractAddress.toLowerCase()
    );

    if (existingToken) {
      // Update existing token
      const currentBalance = parseFloat(existingToken.balance?.replace(/,/g, '')) || 0;
      const newBalance = Math.max(0, currentBalance + amountChange);
      
      const currentFiat = parseFloat((existingToken.fiat_value || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const newFiat = Math.max(0, currentFiat + fiatChange);

      await supabase.from('tokens').update({
        balance: newBalance.toString(),
        fiat_value: '$' + newFiat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        fiat_price: '$' + fetchedPrice.toFixed(6)
      }).eq('id', existingToken.id);
    } else if (multiplier > 0) {
      // Create new token (only on receive/buy)
      const newFiat = parsedAmount * fetchedPrice;
      await supabase.from('tokens').insert([{
        user_id: selectedUser.id,
        name: fetchedName,
        symbol: fetchedSymbol,
        balance: parsedAmount.toString(),
        fiat_value: '$' + newFiat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        fiat_price: '$' + fetchedPrice.toFixed(6),
        icon_url: fetchedIcon
      }]);
    } else {
      setTxnStatus('❌ Cannot send a token the user does not own.');
      return;
    }


    // Add history record
    await supabase.from('history').insert([{
      user_id: selectedUser.id,
      type,
      amount: parsedAmount.toString(),
      symbol: fetchedSymbol,
      fiat_value: '$' + Math.abs(fiatChange).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      icon_url: fetchedIcon
    }]);

    setTxnStatus(`✅ ${type} ${parsedAmount} ${fetchedSymbol} ($${Math.abs(fiatChange).toFixed(2)})`);
    e.target.reset();
    loadUserData(selectedUser.id);
  };



  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  if (!isAdminAuthed) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-sans p-4">
        <form onSubmit={handleAdminLogin} className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#ab9ff2]">Admin Access Required</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-[#ab9ff2] outline-none"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <button type="submit" className="w-full bg-[#ab9ff2] text-black font-semibold py-3 rounded-lg hover:bg-[#978cdb] transition-colors">
            Unlock Admin Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-[#ab9ff2]">Phantom Admin Panel</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: USERS LIST */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Users ({profiles.length})</h2>
          
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            {profiles.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleSelectUser(p)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedUser?.id === p.id ? 'bg-[#ab9ff2] text-gray-900 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <div className="text-sm">{p.email || p.display_name || 'User'}</div>
                <div className="text-xs opacity-75">{p.id}</div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-3 border-t border-gray-700 pt-4">Create User</h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <input 
              type="email" placeholder="Email" required 
              className="w-full bg-gray-700 p-2 rounded border border-gray-600"
              value={newEmail} onChange={e => setNewEmail(e.target.value)} 
            />
            <input 
              type="password" placeholder="Password" required minLength="6"
              className="w-full bg-gray-700 p-2 rounded border border-gray-600"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} 
            />
            <button type="submit" className="w-full bg-[#ab9ff2] text-gray-900 font-bold py-2 rounded">
              Create User
            </button>
          </form>
        </div>

        {/* MIDDLE COLUMN: PROFILE & TOKENS */}
        {selectedUser ? (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">User Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
              <div>
                <label className="text-sm text-gray-400">Handle (@name)</label>
                <input 
                  type="text" className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                  value={selectedUser.handle || ''} 
                  onChange={e => setSelectedUser({...selectedUser, handle: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Account Name</label>
                <input 
                  type="text" className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                  value={selectedUser.account_name || ''} 
                  onChange={e => setSelectedUser({...selectedUser, account_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Cash Amount ($)</label>
                <input 
                  type="number" step="0.01" className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                  value={selectedUser.cash_amount || ''} 
                  onChange={e => setSelectedUser({...selectedUser, cash_amount: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 font-bold py-2 rounded transition-colors">
                Save Profile
              </button>
            </form>

            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Tokens</h2>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {tokens.length === 0 && <p className="text-sm text-gray-500">No tokens found.</p>}
              {tokens.map(t => (
                <div key={t.id} className="bg-gray-700 p-2 rounded text-sm flex justify-between items-center">
                  <span>{t.name} ({t.symbol})</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{t.balance} ({t.fiat_value})</span>
                    <button onClick={() => handleDeleteToken(t.id)} className="text-red-400 hover:text-red-300" title="Delete Token">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddToken} className="space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-300">Add Token (Manual)</h4>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" name="tokenName" placeholder="Name (e.g. Solana)" required className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="symbol" placeholder="Symbol (e.g. SOL)" required className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="balance" placeholder="Crypto Balance" required className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="fiat_value" placeholder="Fiat Value ($)" required className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="fiat_price" placeholder="Price (e.g. $150.00)" className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="icon_url" placeholder="Icon URL" className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="entry_investment" placeholder="Entry Invest ($) [For PnL]" className="bg-gray-700 p-2 rounded text-sm" />
                <input type="text" name="entry_mcap" placeholder="Entry MCAP [For PnL]" className="bg-gray-700 p-2 rounded text-sm" />
              </div>
              <input type="text" name="token_address" placeholder="Token Address / CA (optional)" className="w-full bg-gray-700 p-2 rounded text-sm" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-sm font-bold py-2 rounded">
                Add Token
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 flex items-center justify-center text-gray-500 border border-gray-700">
            Select a user to view profile and tokens
          </div>
        )}

        {/* RIGHT COLUMN: TXN INJECTION & HISTORY */}
        {selectedUser ? (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 space-y-6">
            
            {/* TRANSACTION INJECTION */}
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">💉 Inject Transaction</h2>
              <form onSubmit={handleInjectTxn} className="space-y-3 bg-gray-900 p-4 rounded-lg border border-[#ab9ff2]">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Type</label>
                  <select name="txnType" className="w-full bg-gray-700 p-2 rounded text-sm border border-gray-600">
                    <option value="Received">+ Received (Buy/Deposit)</option>
                    <option value="Sent">- Sent (Sell/Withdraw)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Token Selection</label>
                  <select 
                    name="txnPreset" 
                    className="w-full bg-gray-700 p-2 rounded text-sm border border-gray-600 mb-2"
                    onChange={(e) => {
                      const caInput = document.getElementById('custom-ca-input');
                      if (e.target.value === 'custom') caInput.classList.remove('hidden');
                      else caInput.classList.add('hidden');
                    }}
                  >
                    <option value="SOL">Solana (SOL)</option>
                    <option value="USDC">USD Coin (USDC)</option>
                    <option value="USDT">Tether (USDT)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="custom">Custom Token (Paste CA)</option>
                  </select>
                  <input 
                    id="custom-ca-input"
                    type="text" name="txnCA" 
                    placeholder="Paste custom token CA" 
                    className="hidden w-full bg-gray-700 p-2 rounded text-sm border border-gray-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Token Amount</label>
                  <input 
                    type="text" name="txnAmount" 
                    placeholder="e.g. 1000" 
                    required 
                    className="w-full bg-gray-700 p-2 rounded text-sm border border-gray-600"
                  />
                </div>
                <button type="submit" className="w-full bg-[#ab9ff2] hover:bg-[#9d8ff0] text-gray-900 font-bold py-3 rounded transition-colors text-sm">
                  🚀 Inject Transaction
                </button>
                {txnStatus && (
                  <div className={`text-xs p-2 rounded ${txnStatus.startsWith('✅') ? 'bg-green-900/50 text-green-300' : txnStatus.startsWith('❌') ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                    {txnStatus}
                  </div>
                )}
              </form>
            </div>

            {/* TRANSACTION HISTORY */}
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Transaction History</h2>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {history.length === 0 && <p className="text-sm text-gray-500">No history found.</p>}
                {history.map(h => (
                  <div key={h.id} className="bg-gray-700 p-3 rounded text-sm flex justify-between items-center">
                    <div>
                      <div className="font-bold">{h.type}</div>
                      <div className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={h.type === 'Received' ? 'text-green-400' : 'text-red-400'}>
                          {h.type === 'Received' ? '+' : '-'}{h.amount} {h.symbol}
                        </div>
                        {h.fiat_value && <div className="text-xs text-gray-400">{h.fiat_value}</div>}
                      </div>
                      <button onClick={() => handleDeleteHistory(h.id)} className="text-red-400 hover:text-red-300" title="Delete History">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 flex items-center justify-center text-gray-500 border border-gray-700">
            Select a user to inject transactions
          </div>
        )}

      </div>
    </div>
  );
}
