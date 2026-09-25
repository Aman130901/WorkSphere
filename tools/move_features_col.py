import glob

html_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\*.html")
css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

old_product_html = """            <ul>
                <li><a href="#">Product Releases</a></li>
                <li class="sub-group-title"><a href="#">Features</a></li>
                <li class="indented"><a href="#">Asset Management</a></li>
                <li class="indented"><a href="#">Leave Management</a></li>
                <li class="indented"><a href="#">Time Tracking</a></li>
                <li class="indented"><a href="#">Hiring</a></li>
                <li><a href="#">Imagine With WorkSphere</a></li>
            </ul>"""

new_product_html = """            <ul>
                <li><a href="#">Product Releases</a></li>
                <li><a href="#">Imagine With WorkSphere</a></li>
            </ul>"""

old_legal_html = """        <div class="footer-col">
            <h4>LEGAL</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">ESG</a></li>
                <li><a href="#">Responsible Disclosure</a></li>
            </ul>
        </div>"""

new_legal_html = """        <div class="footer-col">
            <h4>LEGAL</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">ESG</a></li>
                <li><a href="#">Responsible Disclosure</a></li>
            </ul>
        </div>
        
        <div class="footer-col">
            <h4>FEATURES</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Asset Management</a></li>
                <li><a href="#">Leave Management</a></li>
                <li><a href="#">Time Tracking</a></li>
                <li><a href="#">Hiring</a></li>
            </ul>
        </div>"""

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_product_html in content and old_legal_html in content:
        content = content.replace(old_product_html, new_product_html)
        content = content.replace(old_legal_html, new_legal_html)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated HTML in {filepath}")

for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace("grid-template-columns: repeat(6, 1fr) !important;", "grid-template-columns: repeat(7, 1fr) !important;")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated CSS to 7 columns in {filepath}")
