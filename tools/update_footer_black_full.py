import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

old_css = """/* FINAL OVERRIDE FOR FOOTER: Pure black, curved corners, max width */
.site-footer {
    background-color: #000000 !important;
    background-image: none !important;
    border-radius: 24px !important;
    margin: 1rem !important;
    width: calc(100% - 2rem) !important;
    max-width: calc(100% - 2rem) !important;
    box-sizing: border-box !important;
    padding: 4rem 4rem 2rem 4rem !important;
}"""

new_css = """/* FINAL OVERRIDE FOR FOOTER: Pure black, curved corners, max width */
.site-footer {
    background-color: #000000 !important;
    background-image: none !important;
    border-radius: 40px 40px 0 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    padding: 6rem 5% 4rem 5% !important;
}"""

for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_css in content:
        new_content = content.replace(old_css, new_css)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        # If for some reason exact match fails, just append an even stronger override
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write("\n" + new_css.replace("/* FINAL OVERRIDE", "/* ABSOLUTE FINAL OVERRIDE"))
        print(f"Appended absolute final override to {filepath}")
