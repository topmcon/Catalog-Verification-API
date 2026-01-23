import json
import re

# Read the file as raw text
with open('src/config/salesforce-picklists/brands.json', 'r') as f:
    content = f.read()

# Fix broken quotes (unclosed strings with newlines)
fixes = [
    ('"CAPITAL LIGHTING FIXTURE C\n', '"CAPITAL LIGHTING FIXTURE COMPANY"'),
    ('"HOME DECORATORS COLLECTION\n', '"HOME DECORATORS COLLECTION"'),
    ('"DCS by FISHER &amp; PAYKEL\n', '"DCS by FISHER & PAYKEL"'),
    ('"Mountain Plumbing Products\n', '"Mountain Plumbing Products"'),
    ('"HOME REFINEMENTS BY JULIEN\n', '"HOME REFINEMENTS BY JULIEN"'),
    ('"CHARLOTTE PIPE AND FOUNDRY\n', '"CHARLOTTE PIPE AND FOUNDRY"'),
    ('"METROPOLITAN LIGHTING FIXT\n', '"METROPOLITAN LIGHTING FIXTURES"'),
    ('"WATTS MUELLER STEAM SPECIA\n', '"WATTS MUELLER STEAM SPECIALTIES"'),
    ('"Preferred Bath Accessories\n', '"Preferred Bath Accessories"'),
]

for old, new in fixes:
    content = content.replace(old, new)

# Validate JSON
try:
    data = json.loads(content)
    print(f"✅ Fixed and validated! Total entries: {len(data)}")
    
    # Write back
    with open('src/config/salesforce-picklists/brands.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("✅ File saved")
except Exception as e:
    print(f"❌ Error: {e}")
