import glob
import re

for file in glob.glob('*.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace `<a href="..." class="logo">gusto</a>` with `<a href="index.html" class="logo">gusto</a>`
    new_content = re.sub(
        r'<a[^>]*class="logo"[^>]*>gusto</a>',
        r'<a href="index.html" class="logo">gusto</a>',
        content,
        flags=re.IGNORECASE
    )
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed logo link in {file}')
