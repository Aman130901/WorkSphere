import re

# Read both files
with open('css/business-types.css', 'r', encoding='utf-8') as f:
    bt_css = f.read()

with open('css/products.css', 'r', encoding='utf-8') as f:
    prod_css = f.read()

# Extract navbar section from business-types.css 
# (everything up to the first page-specific section)
bt_lines = bt_css.split('\n')
navbar_end_line = 0
for i, line in enumerate(bt_lines):
    if any(kw in line for kw in ['.business-hero', '.split-section', '.switch-section', 
                                   '.hero-section', '.testimonial', '.final-cta', '.footer']):
        navbar_end_line = i
        break

bt_navbar_css = '\n'.join(bt_lines[:navbar_end_line]).strip()

# Extract page-specific section from products.css
# (everything AFTER the navbar/header section - starting from the first page-specific class)
prod_lines = prod_css.split('\n')
prod_content_start = 0
for i, line in enumerate(prod_lines):
    # Find where products-specific content begins (hero, sections, etc.)
    if any(kw in line for kw in ['.hero ', '.hero{', '.hero-', '.products-hero', 
                                   '.feature-', '.section-', '.pricing-', '.footer',
                                   '/* --- Hero', '/* --- Products', '/* --- Features',
                                   '/* Hero', '/* Products', '/* Features']):
        prod_content_start = i
        break

prod_page_css = '\n'.join(prod_lines[prod_content_start:]).strip()

print(f"BT navbar CSS: {len(bt_navbar_css)} chars")
print(f"Products page content start line: {prod_content_start}")
print(f"Products page CSS: {len(prod_page_css)} chars")
print("\nFirst 200 chars of prod page CSS:")
print(prod_page_css[:200])

# Combine: bt navbar + products page content
new_products_css = bt_navbar_css + '\n\n' + prod_page_css

# Also add nav-active CSS at the end
nav_active_css = """
/* Active nav link */
.nav-link.nav-active {
    color: var(--primary-red) !important;
}
"""

# Remove duplicate nav-active if any
new_products_css = re.sub(r'/\* Active nav link \*/.*?nav-active.*?\}', '', new_products_css, flags=re.DOTALL)
new_products_css = new_products_css.strip() + nav_active_css

with open('css/products.css', 'w', encoding='utf-8') as f:
    f.write(new_products_css)

print("\nDone! Written to css/products.css")
print(f"Total size: {len(new_products_css)} chars")
