css_to_insert = """
/* Token Details & Trading Overlays */
.token-details-container, .trading-container {
    background-color: var(--bg-color);
    color: var(--text-primary);
}

.td-actions button, .td-timeframes button, .trade-quick-percents button, .trade-keypad button {
    cursor: pointer;
    transition: transform 0.1s, opacity 0.2s;
}

.td-actions button:active, .td-timeframes button:active, .trade-quick-percents button:active, .trade-keypad button:active {
    transform: scale(0.95);
    opacity: 0.8;
}

.trade-keypad button {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 28px;
    font-weight: 500;
    font-family: var(--font-main);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
}

.trade-confirm {
    transition: background-color 0.2s, opacity 0.2s;
}

.trade-confirm.enabled {
    opacity: 1 !important;
    pointer-events: auto !important;
    cursor: pointer;
}
"""

with open("styles.css", "a") as f:
    f.write(css_to_insert)
print("CSS appended successfully.")
