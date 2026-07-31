with open("script.js", "r") as f:
    content = f.read()

# Make sure saveState is called
old_btn = "onclick=\"appState.tokens.splice(${i},1); renderEditTokens(); renderApp();\""
new_btn = "onclick=\"appState.tokens.splice(${i},1); saveState(); renderEditTokens(); renderApp();\""
content = content.replace(old_btn, new_btn)

with open("script.js", "w") as f:
    f.write(content)
print("Added saveState to remove button.")
