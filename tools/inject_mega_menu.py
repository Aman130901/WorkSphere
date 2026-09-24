import glob
import os
import re

mega_menu_html = """
<div class="nav-item has-dropdown">
    <a href="business-types.html" class="nav-link">Business types <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
    <div class="mega-menu">
        <div class="mega-col">
            <p class="mega-eyebrow">BY SIZE</p>
            <a href="#" class="mega-link">
                <strong>Small business</strong>
                <span>Run payroll, file taxes, stay compliant and so much more</span>
            </a>
            <a href="#" class="mega-link">
                <strong>Medium-sized business</strong>
                <span>Grow, expand, and add benefits without the admin</span>
            </a>
            <a href="#" class="mega-link">
                <strong>Larger business</strong>
                <span>More people, more states, more complexity - one platform</span>
            </a>
            <a href="#" class="mega-link">
                <strong>One employee: Solo</strong>
                <span>Pay yourself and contractors compliantly</span>
            </a>
            <a href="#" class="mega-link">
                <strong>Contractor only</strong>
                <span>Onboard and pay 1099 contractors</span>
            </a>
            <a href="#" class="mega-link-all">
                <span>📁</span> All Business solutions
            </a>
        </div>
        <div class="mega-col">
            <p class="mega-eyebrow">BY INDUSTRY</p>
            <a href="#" class="mega-link"><strong>Technology</strong></a>
            <a href="#" class="mega-link"><strong>Construction</strong></a>
            <a href="#" class="mega-link"><strong>Healthcare</strong></a>
            <a href="#" class="mega-link"><strong>Professional services</strong></a>
            <a href="#" class="mega-link"><strong>Real estate</strong></a>
            <a href="industries.html" class="mega-link-all">
                <span>🏪</span> All Industries
            </a>
        </div>
        <div class="mega-col mega-card-col">
            <div class="mega-card" style="padding: 0; display: flex; flex-direction: column;">
                <div style="background: linear-gradient(135deg, #ff7a45, #d62464); color: white; padding: 2rem; border-radius: 12px; text-align: center;">
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">Meet your new</p>
                    <h3 style="font-size: 2.2rem; font-family: 'Playfair Display', serif; margin-bottom: 0;">Cofounder</h3>
                </div>
                <p style="padding: 1.5rem 1.5rem 0; font-weight: 600; color: #1a7b7a; line-height: 1.4;">The AI teammate built to handle your business</p>
                <div class="mega-card-divider" style="margin: 1.5rem; height: 1px; background: rgba(0,0,0,0.1);"></div>
                <a href="#" class="mega-card-link" style="padding: 0 1.5rem 1rem; color: #1a1a1a; font-weight: 600; text-decoration: none;">How Gusto compares</a>
                <a href="#" class="mega-card-link" style="padding: 0 1.5rem 1rem; color: #1a1a1a; font-weight: 600; text-decoration: none;">Apps & integrations</a>
                <a href="#" class="mega-card-link" style="padding: 0 1.5rem 1.5rem; color: #1a1a1a; font-weight: 600; text-decoration: none;">Changing payroll providers</a>
            </div>
        </div>
    </div>
</div>
"""

def read_file(filepath):
    # Try reading as utf-8 first
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'ℼ佄呃偙⁅' in content:
                # It's actually utf-16-le parsed as utf-8
                raise UnicodeDecodeError("utf-8", b"", 0, 1, "utf-16-le detected")
            return content
    except UnicodeDecodeError:
        pass

    # Try utf-16-le
    try:
        with open(filepath, 'r', encoding='utf-16-le') as f:
            return f.read()
    except UnicodeDecodeError:
        pass
        
    # Try cp1252
    with open(filepath, 'r', encoding='cp1252', errors='ignore') as f:
        return f.read()

for file in glob.glob('*.html'):
    content = read_file(file)
    
    if '>All Business solutions<' in content:
        print(f"Skipping {file}, mega menu already exists.")
        continue
    
    # Need to match "<a ...>Business types <svg..."
    pattern = r'<a[^>]*class="nav-link"[^>]*>\s*Business types\s*<svg.*?</svg>\s*</a>'
    
    if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
        new_content = re.sub(pattern, mega_menu_html, content, flags=re.IGNORECASE | re.DOTALL)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")
    else:
        print(f"Could not find Business types link in {file}")
