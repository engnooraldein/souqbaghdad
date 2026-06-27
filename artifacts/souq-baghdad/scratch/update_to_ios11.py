import os

dash_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\owner_dash.tsx"
app_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(dash_path, "r", encoding="utf-8") as f:
    dash_content = f.read()

# 1. Update tab state type
dash_content = dash_content.replace(
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'|'changelog'>('overview');",
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'|'changelog'>('overview');"
)

# 2. Replace Header Badge to ios1.1
header_target = '🚀 الإصدار v1.2'
header_replacement = '🚀 الإصدار ios1.1'
dash_content = dash_content.replace(header_target, header_replacement)

# 3. Replace Tab label to ios1.1
tab_target = "['changelog','🚀 التحديثات (v1.2)']"
tab_replacement = "['changelog','🚀 التحديثات (ios1.1)']"
dash_content = dash_content.replace(tab_target, tab_replacement)

# 4. Replace Changelog Content references
dash_content = dash_content.replace("v1.2.0", "ios1.1")
dash_content = dash_content.replace("v1.2", "ios1.1")
dash_content = dash_content.replace("الإصدار v1.2.0", "الإصدار ios1.1")
dash_content = dash_content.replace("الإصدار v1.2", "الإصدار ios1.1")

with open(dash_path, "w", encoding="utf-8") as f:
    f.write(dash_content)

print("Updated owner_dash.tsx to ios1.1")

# 5. Sync with App.tsx
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

owner_func_code = dash_content[:dash_content.find("// ─────────────────────────────────────────────\n// Admin Panel")].strip()
if not owner_func_code:
    owner_func_code = dash_content[:dash_content.find("function AdminPanel")].strip()

start_idx = app_content.find("function OwnerDashboard")
end_idx = app_content.find("// ─────────────────────────────────────────────\n// Admin Panel")

if start_idx != -1 and end_idx != -1:
    new_app = app_content[:start_idx] + owner_func_code + "\n\n" + app_content[end_idx:]
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_app)
    print("App.tsx synced with owner_dash.tsx successfully!")
