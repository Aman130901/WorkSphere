import glob
import re

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace("grid-template-columns: repeat(4, 1fr);", "grid-template-columns: repeat(3, 1fr);")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated footer grid columns in {filepath}")
    else:
        print(f"No changes made to {filepath}")
