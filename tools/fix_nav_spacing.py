files = [
    'css/index.css',
    'css/products.css',
    'css/business-types.css',
    'css/accountants.css',
    'css/resources.css',
    'css/pricing.css',
]

OLD = """.nav-right {
    display: flex;
    align-items: center;
    gap: 2rem;
}"""

NEW = """.nav-right {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-left: auto;
}"""

for cssfile in files:
    with open(cssfile, 'r', encoding='utf-8') as f:
        text = f.read()
    new_text = text.replace(OLD, NEW)
    if new_text != text:
        with open(cssfile, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f'Fixed: {cssfile}')
    else:
        print(f'No change: {cssfile}')
