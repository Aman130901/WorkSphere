import glob
import re

new_footer_html = """<footer class="site-footer">
    <div class="footer-grid">
        <div class="footer-col">
            <h4>PRODUCT</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Product Releases</a></li>
                <li class="sub-group-title"><a href="#">Features</a></li>
                <li class="indented"><a href="#">Asset Management</a></li>
                <li class="indented"><a href="#">Leave Management</a></li>
                <li class="indented"><a href="#">Time Tracking</a></li>
                <li class="indented"><a href="#">Hiring</a></li>
                <li><a href="#">Imagine With WorkSphere</a></li>
            </ul>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Pricing</a></li>
                <li class="indented"><a href="#">Enterprise Plan</a></li>
            </ul>
        </div>
        
        <div class="footer-col">
            <h4>COMMUNITY</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Slack</a></li>
                <li><a href="#">Reddit Community</a></li>
                <li><a href="#">X / Twitter</a></li>
            </ul>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Learn</a></li>
                <li><a href="#">Use Cases</a></li>
                <li><a href="#">Compare WorkSphere</a></li>
                <li><a href="#">Getting Started Guide</a></li>
                <li><a href="#">Template Gallery</a></li>
            </ul>
        </div>

        <div class="footer-col">
            <h4>SUPPORT</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Support</a></li>
            </ul>
        </div>

        <div class="footer-col">
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
        </div>
        
        <div class="footer-col">
            <h4>DOWNLOAD</h4>
            <div class="col-divider"></div>
            <ul>
                <li><a href="#">WorkSphere for iPhone</a></li>
                <li><a href="#">WorkSphere for iPad</a></li>
                <li><a href="#">WorkSphere for Mac</a></li>
                <li><a href="#">WorkSphere for Windows</a></li>
                <li class="indented"><a href="#">Windows x64</a></li>
                <li class="indented"><a href="#">Windows ARM64</a></li>
                <li><a href="#">WorkSphere for Vision Pro</a></li>
                <li><a href="#">WorkSphere for Android</a></li>
            </ul>
        </div>
    </div>

    <div class="footer-bottom-row">
        <div class="footer-legal">
            © 2026 WorkSphere, Inc. All rights reserved.
        </div>
        <div class="footer-social-wrapper">
            <span class="footer-lang">English</span>
            <div class="footer-social">
                <a href="#">IG</a>
                <a href="#">YT</a>
                <a href="#">X</a>
                <a href="#">in</a>
            </div>
        </div>
    </div>
</footer>"""

new_footer_css = """
/* Craft Style Footer Override */
.site-footer {
    background-color: #111111 !important;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E") !important;
    border-radius: 12px;
    margin: 2rem !important;
    padding: 4rem 4rem 2rem 4rem !important;
    color: #a0a0a0 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

.footer-grid {
    display: grid !important;
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 2rem !important;
    max-width: 100% !important;
    padding-bottom: 4rem !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    margin: 0 !important;
}

.footer-col h4 {
    color: #ffffff !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.05em !important;
    margin-bottom: 1rem !important;
    text-transform: uppercase !important;
}

.col-divider {
    height: 1px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    margin: 1rem 0 !important;
    width: 100% !important;
}

.footer-col ul {
    list-style: none !important;
    padding: 0 !important;
    margin: 0 !important;
}

.footer-col li {
    margin-bottom: 0.75rem !important;
}

.footer-col a {
    color: #a0a0a0 !important;
    text-decoration: none !important;
    font-size: 0.85rem !important;
    transition: color 0.2s !important;
}

.footer-col a:hover {
    color: #ffffff !important;
}

.footer-col .indented {
    padding-left: 1rem !important;
}

.footer-col .sub-group-title a {
    color: #ffffff !important;
}

.footer-bottom-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-top: 2rem !important;
    font-size: 0.85rem !important;
}

.footer-social-wrapper {
    display: flex !important;
    align-items: center !important;
    gap: 1.5rem !important;
}

.footer-social {
    display: flex !important;
    gap: 0.5rem !important;
}

.footer-social a {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 32px !important;
    height: 32px !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 6px !important;
    color: #ffffff !important;
    text-decoration: none !important;
    transition: background 0.2s !important;
    font-size: 0.8rem !important;
}

.footer-social a:hover {
    background: rgba(255, 255, 255, 0.1) !important;
}
"""

html_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\*.html")

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'<footer class="site-footer">.*?</footer>', re.DOTALL)
    new_content = pattern.sub(new_footer_html, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated HTML footer in {filepath}")

css_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\css\*.css")

for filepath in css_files:
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("\n" + new_footer_css)
    print(f"Appended Craft footer CSS to {filepath}")

print("Done implementing Craft footer!")
