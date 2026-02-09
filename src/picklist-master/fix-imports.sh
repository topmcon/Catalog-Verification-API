#!/bin/bash
# Fix imports in picklist-master to use centralized locations

# Fix dual-ai-verification.service.ts
sed -i "s|from '../config/category-attributes'|from '../04-attributes/category-attributes'|g" 06-multiple-picklist-files/dual-ai-verification.service.ts
sed -i "s|from '../config/category-style-mapping'|from '../03-styles/category-style-mapping'|g" 06-multiple-picklist-files/dual-ai-verification.service.ts
sed -i "s|from '../config/category-aliases'|from '../../config/category-aliases'|g" 06-multiple-picklist-files/dual-ai-verification.service.ts
sed -i "s|import \* as lookups from '../config/lookups'|import * as lookups from '../05-category-filter-attributes/lookups'|g" 06-multiple-picklist-files/dual-ai-verification.service.ts

# Fix enrichment.service.ts
sed -i "s|from '../config/category-attributes'|from '../04-attributes/category-attributes'|g" 06-multiple-picklist-files/enrichment.service.ts
sed -i "s|from '../config/master-category-schema-map'|from '../02-categories/master-category-schema-map'|g" 06-multiple-picklist-files/enrichment.service.ts

# Fix response-builder.service.ts
sed -i "s|from '../config/master-category-schema-map'|from '../02-categories/master-category-schema-map'|g" 06-multiple-picklist-files/response-builder.service.ts

# Fix category-matcher.service.ts
sed -i "s|from '../config/category-schema'|from '../../config/category-schema'|g" 02-categories/category-matcher.service.ts

# Fix picklist-matcher.service.ts
sed -i "s|from '../config/category-consolidation-mapping'|from '../02-categories/category-consolidation-mapping'|g" 04-attributes/picklist-matcher.service.ts

# Fix remaining files
sed -i "s|from '../config/verified-fields'|from '../../config/verified-fields'|g" 06-multiple-picklist-files/*.ts
sed -i "s|from '../config/category-schema'|from '../../config/category-schema'|g" 06-multiple-picklist-files/*.ts
sed -i "s|from '../config/category-config'|from '../../config/category-config'|g" 06-multiple-picklist-files/*.ts

echo "✓ Fixed all imports in picklist-master"
