import glob
import re

html_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\*.html")

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We will remove the exact string
    new_content = re.sub(r'\s*<div class="footer-divider"></div>\s*', '\n\n        ', content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Removed footer divider in {filepath}")
    else:
        print(f"No changes made to {filepath}")
