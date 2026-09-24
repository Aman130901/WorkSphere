import glob

html_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\*.html")

old_html = """        <div class="footer-col">
            <h4>COMPANY</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">About us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Affiliate Program</a></li>
                <li><a href="#">Media</a></li>
            </ul>
            <div class="col-divider"></div>
            <ul>
                <li class="sub-group-title"><a href="#">Legal</a></li>
                <li class="indented"><a href="#">Terms</a></li>
                <li class="indented"><a href="#">Privacy Policy</a></li>
                <li class="indented"><a href="#">Security</a></li>
                <li class="indented"><a href="#">ESG</a></li>
                <li class="indented"><a href="#">Responsible Disclosure</a></li>
            </ul>
        </div>"""

new_html = """        <div class="footer-col">
            <h4>COMPANY</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">About us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Affiliate Program</a></li>
                <li><a href="#">Media</a></li>
            </ul>
        </div>
        
        <div class="footer-col">
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

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_html in content:
        new_content = content.replace(old_html, new_html)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated HTML in {filepath}")
