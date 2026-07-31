with open("script.js", "r") as f:
    content = f.read()

# 1. Remove Main Balance from Edit Modal (lines 425 and 435 in previous logic, but let's just regex replace)
import re

# Remove edit-main-balance from modal open
content = re.sub(r"document\.getElementById\('edit-main-balance'\)\.value = appState\.mainBalance;\n", "", content)
# Remove edit-main-balance from modal save
content = re.sub(r"appState\.mainBalance = document\.getElementById\('edit-main-balance'\)\.value;\n", "", content)

# 2. Change onchange to oninput so it saves even without blur
content = content.replace('onchange="appState.tokens[${i}].name=this.value"', 'oninput="appState.tokens[${i}].name=this.value"')
content = content.replace('onchange="appState.tokens[${i}].amount=this.value"', 'oninput="appState.tokens[${i}].amount=this.value"')
content = content.replace('onchange="appState.tokens[${i}].fiatValue=this.value"', 'oninput="appState.tokens[${i}].fiatValue=this.value"')
content = content.replace('onchange="appState.tokens[${i}].entryInvestment=this.value"', 'oninput="appState.tokens[${i}].entryInvestment=this.value"')
content = content.replace('onchange="appState.tokens[${i}].entryMcap=this.value"', 'oninput="appState.tokens[${i}].entryMcap=this.value"')

with open("script.js", "w") as f:
    f.write(content)

with open("index.html", "r") as f:
    html = f.read()

# Remove Main Balance input from HTML to prevent confusion
html = re.sub(r'<div class="form-group">\s*<label>Main Balance</label>\s*<input type="text" id="edit-main-balance" name="mainBalance" required>\s*</div>', '', html)

with open("index.html", "w") as f:
    f.write(html)

print("Inputs fixed.")
