import glob
import re

# This script adds the active-nav JS snippet to all HTML files
# before </body> to highlight the current page's nav link

JS_SNIPPET = """
    <script>
    // Highlight active nav link based on current page
    (function() {
        var page = window.location.pathname.split('/').pop() || 'index.html';
        var map = {
            'products.html': 'products.html',
            'business-types.html': 'business-types.html',
            'accountants.html': 'accountants.html',
            'resources.html': 'resources.html',
            'pricing.html': 'pricing.html',
            'industries.html': 'business-types.html'
        };
        var target = map[page];
        if (target) {
            var links = document.querySelectorAll('.nav-link');
            links.forEach(function(link) {
                if (link.getAttribute('href') === target) {
                    link.classList.add('nav-active');
                }
            });
        }
    })();
    </script>
"""

CSS_SNIPPET = """
/* Active nav link */
.nav-link.nav-active {
    color: var(--primary-red) !important;
}
"""

for htmlfile in glob.glob('*.html'):
    with open(htmlfile, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add JS before </body> if not already present
    if 'nav-active' not in content:
        content = content.replace('</body>', JS_SNIPPET + '\n</body>')
        with open(htmlfile, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Added JS to {htmlfile}')
    else:
        print(f'Already has active nav in {htmlfile}')

# Add CSS to all CSS files
for cssfile in glob.glob('css/*.css'):
    with open(cssfile, 'r', encoding='utf-8') as f:
        css = f.read()
    if 'nav-active' not in css and 'navbar' in css:
        css += CSS_SNIPPET
        with open(cssfile, 'w', encoding='utf-8') as f:
            f.write(css)
        print(f'Added CSS to {cssfile}')
