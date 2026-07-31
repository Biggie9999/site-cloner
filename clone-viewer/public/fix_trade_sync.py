with open("script.js", "r") as f:
    content = f.read()

import re

# We will synchronously recalculate solToken.fiatValue and currentToken.fiatValue before renderApp()
sync_logic = """
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
"""

content = content.replace("        renderApp();\n    });\n\n    // --- Edit Modal Form Logic ---", sync_logic + "    });\n\n    // --- Edit Modal Form Logic ---")

with open("script.js", "w") as f:
    f.write(content)
print("Synchronous UI update added.")
