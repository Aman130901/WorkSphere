import re

# Read both files
with open('css/business-types.css', 'r', encoding='utf-8') as f:
    bt_css = f.read()

with open('css/products.css', 'r', encoding='utf-8') as f:
    prod_css = f.read()

# Extract navbar CSS block from business-types.css
# It spans from the start up to the first non-navbar section (like .hero, .business-hero, etc.)
# Business-types navbar CSS ends before the page-specific styles
# Let's extract from start to the first main-content section marker

# Find the end of navbar-related CSS in business-types.css
# The navbar section ends where page-specific content begins
# (looking for the first hero/section/page-specific class)
bt_lines = bt_css.split('\n')
navbar_end = 0
for i, line in enumerate(bt_lines):
    if any(kw in line for kw in ['.business-hero', '.split-section', '.switch-section', 
                                   '.hero-section', '.testimonial', '.final-cta', '.footer']):
        navbar_end = i
        break

bt_navbar_css = '\n'.join(bt_lines[:navbar_end]).strip()
print("=== Business-types navbar CSS (first 1500 chars) ===")
print(bt_navbar_css[:1500])
print(f"\nTotal navbar CSS chars: {len(bt_navbar_css)}")
