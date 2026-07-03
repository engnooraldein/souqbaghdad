import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target_tv_types = """  isInitialLoading?: boolean;
}) {"""

replacement_tv_types = """  isInitialLoading?: boolean;
  storedUsers?: any[];
}) {"""

if target_tv_types in content:
    content = content.replace(target_tv_types, replacement_tv_types)
    print("7. Updated TransportView props type interface.")
else:
    print("ERROR 7: TransportView props type target not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\nDone! Remaining transport props interface applied successfully.")
