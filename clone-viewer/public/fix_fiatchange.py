with open("script.js", "r") as f:
    content = f.read()

import re

# We need to replace these lines:
old_code = """                    token.fiatValue = formatMoney(currentValue);
                    token.fiatChange = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
                    token.changeType = change24h >= 0 ? 'positive' : 'negative';
                    
                    totalCurrentDynamicValue += currentValue;
                    const previousValue = currentValue / (1 + (change24h / 100));
                    totalPreviousDynamicValue += previousValue;"""

new_code = """                    token.fiatValue = formatMoney(currentValue);
                    
                    totalCurrentDynamicValue += currentValue;
                    const previousValue = currentValue / (1 + (change24h / 100));
                    totalPreviousDynamicValue += previousValue;
                    
                    const dollarChange = currentValue - previousValue;
                    token.fiatChange = `${dollarChange >= 0 ? '+' : '-'}${formatMoney(Math.abs(dollarChange))}`;
                    token.changeType = dollarChange >= 0 ? 'positive' : 'negative';"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("script.js", "w") as f:
        f.write(content)
    print("Updated fiatChange successfully.")
else:
    print("Could not find the block to replace.")
