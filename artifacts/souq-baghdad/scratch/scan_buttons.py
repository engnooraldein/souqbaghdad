import re

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

button_regex = re.compile(r"<button\b[^>]*>", re.IGNORECASE)

results = []
for idx, line in enumerate(lines):
    match = button_regex.search(line)
    if match:
        tag_content = match.group(0)
        has_title = 'title=' in tag_content
        has_aria = 'aria-label=' in tag_content
        
        # If it doesn't have title or aria-label, inspect the children/text
        if not (has_title or has_aria):
            # Check if there is Arabic text on the line (which means it probably has text)
            # Or if it contains components like X, Chevron, Eye, Copy, Trash, etc.
            # Let's write all non-labeled buttons to review them
            results.append(f"Line {idx + 1}: {line.strip()}")

output_path = r"c:\Users\hp\.gemini\antigravity-ide\brain\de04beb1-e1ac-4576-9dd8-88d107c1041b\scratch\unlabeled_buttons.txt"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(results))

print("Scan completed! Output written to scratch/unlabeled_buttons.txt")
