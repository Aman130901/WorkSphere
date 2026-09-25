import glob

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

alignment_css = """
/* ALIGNMENT FIX FOR FOOTER COLUMNS */
.footer-col {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
}
.footer-col h4, .footer-col .col-divider, .footer-col ul {
    align-self: flex-start !important;
    text-align: left !important;
    width: 100% !important;
}
.footer-col li {
    text-align: left !important;
}
"""

for filepath in css_files:
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("\n" + alignment_css)
    print(f"Appended alignment fix to {filepath}")
