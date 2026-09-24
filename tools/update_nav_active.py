import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

old_style = """.nav-link.nav-active {
    color: #000000 !important;
    font-weight: 700;
}"""

new_style = """.nav-link.nav-active {
    color: #000000 !important;
    font-weight: 700 !important;
    position: relative !important;
}
.nav-link.nav-active::after {
    content: '' !important;
    position: absolute !important;
    bottom: -4px !important;
    left: 0 !important;
    width: 100% !important;
    height: 2px !important;
    background-color: #ea503f !important;
    border-radius: 2px !important;
}"""

for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if old_style in content:
        new_content = content.replace(old_style, new_style)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
