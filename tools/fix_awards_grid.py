import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

for filepath in css_files:
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("""
/* FIX: 4 awards in one row */
.awards-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 1.5rem !important;
}
""")
    print(f"Applied awards-grid 4-col fix to {filepath}")
