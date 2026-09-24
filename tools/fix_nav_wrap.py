import re

FILES = [
    'css/business-types.css',
    'css/accountants.css',
    'css/resources.css',
    'css/pricing.css',
]

OLD_NAV_LINKS = """.nav-links {
    display: flex;
    gap: 1.5rem;
}"""

NEW_NAV_LINKS = """.nav-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}"""

OLD_NAV_LINK_ITEM = """    gap: 0.25rem;
    padding: 0.5rem;
    transition: color 0.2s;"""

NEW_NAV_LINK_ITEM = """    gap: 0.3rem;
    white-space: nowrap;
    transition: color 0.2s;"""

for cssfile in FILES:
    try:
        with open(cssfile, 'r', encoding='utf-8') as f:
            text = f.read()
        
        new_text = text.replace(OLD_NAV_LINKS, NEW_NAV_LINKS)
        new_text = new_text.replace(OLD_NAV_LINK_ITEM, NEW_NAV_LINK_ITEM)
        
        if new_text != text:
            with open(cssfile, 'w', encoding='utf-8') as f:
                f.write(new_text)
            print(f'Fixed: {cssfile}')
        else:
            print(f'No change needed: {cssfile}')
    except Exception as e:
        print(f'Error on {cssfile}: {e}')
