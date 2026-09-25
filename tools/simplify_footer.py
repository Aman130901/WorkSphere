import os
import glob
import re

new_footer = """<footer class="site-footer">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>Products</h4>
                <ul>
                    <li><a href="#">Asset Management</a></li>
                    <li><a href="#">Leave Management</a></li>
                    <li><a href="#">Time Tracking</a></li>
                    <li><a href="#">Hiring & Onboarding</a></li>
                </ul>
            </div>
            
            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Careers</a></li>
                    <li><a href="#">Press</a></li>
                    <li><a href="#">Contact</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Resources</h4>
                <ul>
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">Business Guides</a></li>
                    <li><a href="#">API Documentation</a></li>
                </ul>
            </div>
        </div>

        <div class="footer-divider"></div>

        <div class="footer-bottom">
            <div class="footer-legal">
                <strong>WorkSphere © 2026</strong>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Security</a>
                <a href="#">Accessibility</a>
            </div>
            <div class="footer-social">
                <span>X</span>
                <span>in</span>
                <span>IG</span>
            </div>
        </div>
    </footer>"""

html_files = glob.glob(r"c:\Users\asonk\Desktop\gusto\*.html")

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match the footer block
    # We use DOTALL to match across newlines
    pattern = re.compile(r'<footer class="site-footer">.*?</footer>', re.DOTALL)
    
    new_content = pattern.sub(new_footer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Simplified footer in {filepath}")
    else:
        print(f"No changes made to {filepath} (footer not found or already simplified)")
