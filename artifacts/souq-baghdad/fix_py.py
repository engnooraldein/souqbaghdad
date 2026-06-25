import re
import sys

try:
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the second handleDeleteProfile using string methods
    first_idx = content.find('const handleDeleteProfile = async')
    if first_idx != -1:
        second_idx = content.find('const handleDeleteProfile = async', first_idx + 10)
        if second_idx != -1:
            end_idx = content.find('  };\n', second_idx)
            if end_idx != -1:
                # Remove the block
                new_content = content[:second_idx] + content[end_idx + 5:]
                with open('src/App.tsx', 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print("Fixed duplicate.")
                sys.exit(0)
    print("Could not find duplicate.")
except Exception as e:
    print(f"Error: {e}")
