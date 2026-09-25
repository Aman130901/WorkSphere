const fs = require('fs');
const path = require('path');

const componentsDir = path.join(process.cwd(), 'src/components');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace bg-orange-600 text-white shadow shadow-orange-500/15 (Settings active tab)
  content = content.replace(/bg-orange-600 text-white shadow shadow-orange-500\/15/g, 'bg-gradient-to-br from-[#ea503f] to-[#7a1505] text-white shadow shadow-red-600/30 border border-white/10');

  // Replace bg-orange-600 border-orange-600 text-white shadow shadow-orange-500/15 (Settings active days)
  content = content.replace(/bg-orange-600 border-orange-600 text-white shadow shadow-orange-500\/15/g, 'bg-gradient-to-br from-[#ea503f] to-[#7a1505] text-white shadow shadow-red-600/30 border border-white/10');

  // Replace bg-orange-600 border-orange-600 text-white (Settings days selector 2)
  content = content.replace(/bg-orange-600 border-orange-600 text-white/g, 'bg-gradient-to-br from-[#ea503f] to-[#7a1505] border border-white/10 text-white');

  // Replace bg-orange-600 text-white (Other buttons missing hover)
  // We use a regex that matches exactly this string to avoid matching avatars (which might have rounded-full bg-orange-600)
  // Wait, let's just replace the exact class string for the buttons.
  // The grep output showed lines like:
  // className="w-full py-2.5 bg-orange-600 text-white font-extrabold rounded-xl uppercase"
  // className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-bold uppercase"
  
  content = content.replace(/bg-orange-600 text-white(?![ \w-]*rounded-full)/g, 'bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20');
  
  // Wait, the avatar has "rounded-full bg-orange-600 text-white". The negative lookahead might not catch it if "rounded-full" is before it.
  // Let's replace specifically in EnterpriseSaaSView.tsx the known bad lines by matching 'bg-orange-600 text-white' when followed by ' rounded' or ' font'.
  // Actually, replacing all `bg-orange-600 text-white` is fine, except for avatars.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

fs.readdirSync(componentsDir).forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    replaceInFile(path.join(componentsDir, file));
  }
});
console.log('Done replacing missed button classes.');
