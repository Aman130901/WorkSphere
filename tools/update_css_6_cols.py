import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

old_css = "grid-template-columns: repeat(5, 1fr) !important;"
new_css = "grid-template-columns: repeat(6, 1fr) !important;"

for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_css in content:
        new_content = content.replace(old_css, new_css)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated CSS in {filepath}")
