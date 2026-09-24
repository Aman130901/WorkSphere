import os

with open('index_recovered_partial.html', 'r', encoding='utf-8') as f:
    partial = f.read()

idx = partial.rfind('<div class="feature-box">')
if idx != -1:
    partial = partial[:idx]

partial += '            </div>\n        </div>\n    </section>\n'

with open('products.html', 'r', encoding='utf-8') as f:
    products_html = f.read()
    
footer_idx = products_html.find('<footer')
if footer_idx != -1:
    footer = products_html[footer_idx:]
    partial += '\n' + footer

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(partial)
    
print('Fully restored index.html')
