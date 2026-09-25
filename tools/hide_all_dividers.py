import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

for filepath in css_files:
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("\n.col-divider { display: none !important; }\n")
    print(f"Appended col-divider hidden to {filepath}")
