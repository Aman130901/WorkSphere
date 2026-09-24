import glob
import re

html_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\*.html")

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the closing ul, divider, and opening ul to merge lists
    # Use regex to handle potential whitespace variations
    pattern_divider = re.compile(r'</ul>\s*<div class="col-divider"></div>\s*<ul>')
    content = pattern_divider.sub('', content)
    
    # Remove indented class
    content = content.replace('<li class="indented">', '<li>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Cleaned up {filepath}")
