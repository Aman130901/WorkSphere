import glob

new_footer_css = """
/* FINAL OVERRIDE FOR FOOTER: Pure black, curved corners, max width */
.site-footer {
    background-color: #000000 !important;
    background-image: none !important;
    border-radius: 24px !important;
    margin: 1rem !important;
    width: calc(100% - 2rem) !important;
    max-width: calc(100% - 2rem) !important;
    box-sizing: border-box !important;
    padding: 4rem 4rem 2rem 4rem !important;
}
"""

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

for filepath in css_files:
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("\n" + new_footer_css)
    print(f"Appended final footer override to {filepath}")

