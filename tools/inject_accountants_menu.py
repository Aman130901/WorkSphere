import glob
import os
import re

mega_menu_html = """
<div class="nav-item has-dropdown">
    <a href="accountants.html" class="nav-link">For accountants <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
    <div class="mega-menu">
        <div class="mega-col">
            <p class="mega-eyebrow">GROW YOUR PRACTICE</p>
            <a href="#" class="mega-link">
                <strong>Become a partner</strong>
                <span>Exclusive tools, support, and revenue share</span>
            </a>
            <a href="#" class="mega-link">
                <strong>Gusto Pro dashboard</strong>
                <span>Track and manage all clients in one place</span>
            </a>
        </div>
        <div class="mega-col">
            <p class="mega-eyebrow">PROFESSIONAL RESOURCES</p>
            <a href="#" class="mega-link"><strong>Accountant blog</strong></a>
            <a href="#" class="mega-link"><strong>Accounting resources</strong></a>
            <a href="#" class="mega-link" style="background-color: #f4f6f5; padding: 0.75rem; border-radius: 8px; color: #1a7b7a;"><strong>Professional development</strong></a>
        </div>
        <div class="mega-col mega-card-col">
            <div class="mega-card" style="padding: 0; display: flex; flex-direction: column;">
                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=250&fit=crop" alt="Accountant working" style="width: 100%; border-top-left-radius: 12px; border-top-right-radius: 12px; height: 160px; object-fit: cover;">
                <a href="#" class="mega-card-link" style="padding: 1.5rem 1.5rem 1rem; color: #1a7b7a; font-weight: 600; text-decoration: none; font-size: 1.05rem; line-height: 1.4;">Earn more with our partner program</a>
                <div class="mega-card-divider" style="margin: 0 1.5rem 1.5rem; height: 1px; background: rgba(0,0,0,0.1);"></div>
                <a href="#" class="mega-card-link" style="padding: 0 1.5rem 1rem; color: #1a1a1a; font-weight: 600; text-decoration: none;">How Gusto compares</a>
                <a href="#" class="mega-card-link" style="padding: 0 1.5rem 1rem; color: #1a1a1a; font-weight: 600; text-decoration: none;">Apps & integrations</a>
                <a href="#" class="mega-card-link" style="padding: 0 1.5rem 1.5rem; color: #1a1a1a; font-weight: 600; text-decoration: none;">Changing payroll providers</a>
            </div>
        </div>
    </div>
</div>
"""

for file in glob.glob('*.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '>GROW YOUR PRACTICE<' in content:
        print(f"Skipping {file}, mega menu already exists.")
        continue
    
    pattern = r'<a[^>]*class="nav-link"[^>]*>\s*For accountants\s*<svg.*?</svg>\s*</a>'
    
    if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
        new_content = re.sub(pattern, mega_menu_html, content, flags=re.IGNORECASE | re.DOTALL)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")
    else:
        print(f"Could not find For accountants link in {file}")
