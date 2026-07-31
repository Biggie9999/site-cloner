with open("script.js", "r") as f:
    content = f.read()

# Insert global assignments after appState is declared
insert_point = "let appState = loadState();\n"
if insert_point in content:
    globals_code = """    let appState = loadState();
    window.appState = appState;
    window.renderEditTokens = function() { renderEditTokens(); };
    window.renderApp = function() { renderApp(); };
    window.saveState = function() { saveState(); };
"""
    content = content.replace(insert_point, globals_code)
    with open("script.js", "w") as f:
        f.write(content)
    print("Globals exposed successfully.")
else:
    print("Could not find insert point.")
