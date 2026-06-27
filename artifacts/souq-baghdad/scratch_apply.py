import os

# Restore base 5403a63 files
with open("scratch_owner_5403a63.tsx", "r", encoding="utf-8") as f:
    owner_content = f.read()

with open("scratch_app_5403a63.tsx", "r", encoding="utf-8") as f:
    app_content = f.read()

# Write golden base back to active files
with open("owner_dash.tsx", "w", encoding="utf-8") as f:
    f.write(owner_content)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(app_content)

print("Restored 5403a63 golden base files successfully!")
