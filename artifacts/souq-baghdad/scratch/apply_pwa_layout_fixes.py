import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Outer container update
target_outer = '<div className="dark min-h-screen bg-gray-950 pb-20 lg:pb-0">'
replacement_outer = '<div className="dark min-h-screen bg-gray-950 pwa-outer-container">'

if target_outer in content:
    content = content.replace(target_outer, replacement_outer)
    print("1. Updated outer container class.")
else:
    print("ERROR 1: Outer container target not found!")

# 2. Top Navigation Glassmorphism & padding
target_top_nav = '<nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">'
replacement_top_nav = '<nav className="fixed top-0 left-0 right-0 z-40 bg-gray-950/70 backdrop-blur-xl border-b border-gray-800/60 pwa-header">'

if target_top_nav in content:
    content = content.replace(target_top_nav, replacement_top_nav)
    print("2. Updated top nav class.")
else:
    print("ERROR 2: Top nav target not found!")

# 3. Main wrapper top padding
target_main = '<main className="pt-[calc(4rem+env(safe-area-inset-top,0px))]">'
replacement_main = '<main className="pwa-main">'

if target_main in content:
    content = content.replace(target_main, replacement_main)
    print("3. Updated main wrapper class.")
else:
    print("ERROR 3: Main wrapper target not found!")

# 4. Bottom Navigation Glassmorphism & safe margin
target_bottom_nav = '<nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 lg:hidden pb-[env(safe-area-inset-bottom,0px)]">'
replacement_bottom_nav = '<nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/70 backdrop-blur-xl border-t border-gray-800/60 lg:hidden pwa-bottom-nav">'

if target_bottom_nav in content:
    content = content.replace(target_bottom_nav, replacement_bottom_nav)
    print("4. Updated bottom nav class.")
else:
    print("ERROR 4: Bottom nav target not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\nDone! PWA Safe Area layout script execution completed.")
