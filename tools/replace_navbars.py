import glob
import re

# 1. Read the correct navbar from index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

start = index_html.find('<nav class="navbar">')
end = index_html.find('</nav>') + 6
navbar_html = index_html[start:end]

# Modify the navbar HTML to match the correct links
# The screenshot showed "Business types" blue (unstyled) and "Create free account" blue (unstyled).
# In index.html, "Create free account" is <button class="btn btn-primary">.
# But wait, in index.html, "Business types" is nested?
print('index.html nav-item count:', navbar_html.count('nav-item'))
print('index.html mega-menu count:', navbar_html.count('mega-menu'))

# Let's fix the navbar string directly to be perfect.
# We will use this navbar to overwrite the navbars in all other html files.
for file in glob.glob('*.html'):
    if file == 'index.html':
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find('<nav class="navbar">')
    end_idx = content.find('</nav>') + 6
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + navbar_html + content[end_idx:]
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Replaced navbar in {file}')

