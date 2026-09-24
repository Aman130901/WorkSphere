import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

for filepath in css_files:
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("""
/* FIX: Keep award badges in one row on all pages */
.logos-top {
    flex-wrap: nowrap !important;
    gap: 3rem !important;
}
""")
    print(f"Applied logos-top nowrap fix to {filepath}")
