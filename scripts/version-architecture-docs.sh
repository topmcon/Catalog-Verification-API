#!/bin/bash
# ============================================================================
# version-architecture-docs.sh
# 
# Creates versioned snapshots of architecture reference documents.
# Called during "Save everything" before git commit.
#
# Maintains a rolling archive of up to 20 versions per document in:
#   docs/architecture-versions/
#
# Each version is named:
#   {DOC_NAME}-v{N}-{YYYY-MM-DD}-{COMMIT_SHORT}.md
#
# Usage:
#   bash scripts/version-architecture-docs.sh
#   bash scripts/version-architecture-docs.sh --dry-run
# ============================================================================

set -e

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSIONS_DIR="$REPO_ROOT/docs/architecture-versions"
MAX_VERSIONS=20

# Documents to version
declare -A DOCS
DOCS["VERIFICATION-ARCHITECTURE-COMPLETE"]="$REPO_ROOT/docs/VERIFICATION-ARCHITECTURE-COMPLETE.md"
DOCS["VERIFICATION-DATA-SOURCES"]="$REPO_ROOT/docs/VERIFICATION-DATA-SOURCES.md"

# --- Parse arguments ---
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE — no files will be created or deleted"
  echo ""
fi

# --- Get current commit and date ---
COMMIT_FULL=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
COMMIT_SHORT=$(echo "$COMMIT_FULL" | cut -c1-7)

# Get date in EST
DATE_EST=$(TZ='America/New_York' date '+%Y-%m-%d')
DATETIME_EST=$(TZ='America/New_York' date '+%Y-%m-%d %H:%M:%S %Z')

echo "============================================================"
echo "  Architecture Document Versioning"
echo "============================================================"
echo "  Date (EST): $DATETIME_EST"
echo "  Commit:     $COMMIT_SHORT ($COMMIT_FULL)"
echo "  Max Versions: $MAX_VERSIONS per document"
echo "  Versions Dir: docs/architecture-versions/"
echo "============================================================"
echo ""

# --- Ensure versions directory exists ---
if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$VERSIONS_DIR"
fi

# --- Get system metrics for metadata header ---
get_system_metrics() {
  local service_file="$REPO_ROOT/src/services/dual-ai-verification.service.ts"
  local title_file="$REPO_ROOT/src/config/title-schema-by-category.ts"
  local brands_file="$REPO_ROOT/src/config/salesforce-picklists/brands.json"
  local categories_file="$REPO_ROOT/src/config/salesforce-picklists/categories.json"
  local styles_file="$REPO_ROOT/src/config/salesforce-picklists/styles.json"
  local attributes_file="$REPO_ROOT/src/config/salesforce-picklists/attributes.json"

  SERVICE_LINES=0
  TITLE_LINES=0
  BRAND_COUNT=0
  CATEGORY_COUNT=0
  STYLE_COUNT=0
  ATTRIBUTE_COUNT=0

  [[ -f "$service_file" ]] && SERVICE_LINES=$(wc -l < "$service_file" | tr -d ' ')
  [[ -f "$title_file" ]] && TITLE_LINES=$(wc -l < "$title_file" | tr -d ' ')
  [[ -f "$brands_file" ]] && BRAND_COUNT=$(python3 -c "import json; print(len(json.load(open('$brands_file'))))" 2>/dev/null || echo "?")
  [[ -f "$categories_file" ]] && CATEGORY_COUNT=$(python3 -c "import json; print(len(json.load(open('$categories_file'))))" 2>/dev/null || echo "?")
  [[ -f "$styles_file" ]] && STYLE_COUNT=$(python3 -c "import json; print(len(json.load(open('$styles_file'))))" 2>/dev/null || echo "?")
  [[ -f "$attributes_file" ]] && ATTRIBUTE_COUNT=$(python3 -c "import json; print(len(json.load(open('$attributes_file'))))" 2>/dev/null || echo "?")

  # Get Claude model from code
  CLAUDE_MODEL=$(grep -o "claude-[a-z0-9\-]*" "$service_file" 2>/dev/null | head -1 || echo "unknown")
  
  # Get recent commits (last 5)
  RECENT_COMMITS=$(git -C "$REPO_ROOT" log --oneline -5 2>/dev/null || echo "  (no git history)")
}

# --- Get next version number for a doc ---
get_next_version() {
  local doc_prefix="$1"
  local latest=0
  
  if [[ -d "$VERSIONS_DIR" ]]; then
    for f in "$VERSIONS_DIR/${doc_prefix}"-v*.md; do
      [[ -f "$f" ]] || continue
      local vnum=$(echo "$f" | grep -oP "(?<=-v)\d+" || echo "0")
      if [[ "$vnum" -gt "$latest" ]]; then
        latest=$vnum
      fi
    done
  fi
  
  echo $((latest + 1))
}

# --- Get previous version info for diff summary ---
get_previous_version_file() {
  local doc_prefix="$1"
  local latest_file=""
  local latest_num=0
  
  if [[ -d "$VERSIONS_DIR" ]]; then
    for f in "$VERSIONS_DIR/${doc_prefix}"-v*.md; do
      [[ -f "$f" ]] || continue
      local vnum=$(echo "$f" | grep -oP "(?<=-v)\d+" || echo "0")
      if [[ "$vnum" -gt "$latest_num" ]]; then
        latest_num=$vnum
        latest_file="$f"
      fi
    done
  fi
  
  echo "$latest_file"
}

# --- Build metadata header ---
build_metadata_header() {
  local doc_name="$1"
  local version="$2"
  local prev_file="$3"
  local prev_commit=""
  local prev_date=""
  local change_summary=""

  if [[ -n "$prev_file" && -f "$prev_file" ]]; then
    prev_commit=$(grep -oP "(?<=Commit: )\S+" "$prev_file" 2>/dev/null | head -1 || echo "unknown")
    prev_date=$(grep -oP "(?<=Snapshot Date: ).*" "$prev_file" 2>/dev/null | head -1 || echo "unknown")
    
    # Generate diff summary between previous version and current working copy
    local current_file="${DOCS[$doc_name]}"
    if [[ -f "$current_file" ]]; then
      local added=$(diff "$prev_file" "$current_file" 2>/dev/null | grep "^>" | wc -l | tr -d ' ')
      local removed=$(diff "$prev_file" "$current_file" 2>/dev/null | grep "^<" | wc -l | tr -d ' ')
      change_summary="Lines added: ~${added}, Lines removed: ~${removed} (vs v$((version-1)))"
    fi
  fi
  
  # Get commits between previous version and now
  local commits_since=""
  if [[ -n "$prev_commit" && "$prev_commit" != "unknown" ]]; then
    commits_since=$(git -C "$REPO_ROOT" log --oneline "${prev_commit}..HEAD" 2>/dev/null | head -10)
  fi

  cat << EOF
<!--
╔══════════════════════════════════════════════════════════════════╗
║  VERSIONED ARCHITECTURE SNAPSHOT — DO NOT EDIT                   ║
║  This is a read-only archive. Edit the working copy instead:    ║
║  docs/${doc_name}.md                                             ║
╚══════════════════════════════════════════════════════════════════╝

  Version:       v${version}
  Snapshot Date: ${DATETIME_EST}
  Commit:        ${COMMIT_SHORT} (${COMMIT_FULL})

  SYSTEM METRICS AT TIME OF SNAPSHOT:
  ─────────────────────────────────────
  dual-ai-verification.service.ts: ${SERVICE_LINES} lines
  title-schema-by-category.ts:     ${TITLE_LINES} lines
  Brands:     ${BRAND_COUNT}
  Categories: ${CATEGORY_COUNT}
  Styles:     ${STYLE_COUNT}
  Attributes: ${ATTRIBUTE_COUNT}
  Claude Model: ${CLAUDE_MODEL}

  CHANGE SUMMARY:
  ─────────────────────────────────────
  ${change_summary:-"First version — no prior snapshot to compare."}

  COMMITS SINCE LAST VERSION:
  ─────────────────────────────────────
${commits_since:-"  (first version or previous commit unknown)"}

  RECENT COMMITS (at snapshot time):
  ─────────────────────────────────────
${RECENT_COMMITS}
-->

EOF
}

# --- Rotate old versions (keep max N) ---
rotate_versions() {
  local doc_prefix="$1"
  local max=$2
  
  # Collect all version files sorted by version number
  local files=()
  local nums=()
  
  for f in "$VERSIONS_DIR/${doc_prefix}"-v*.md; do
    [[ -f "$f" ]] || continue
    local vnum=$(echo "$f" | grep -oP "(?<=-v)\d+" || echo "0")
    files+=("$f")
    nums+=("$vnum")
  done
  
  local count=${#files[@]}
  
  if [[ "$count" -gt "$max" ]]; then
    # Sort by version number and remove oldest
    local excess=$((count - max))
    echo "  ⚠️  Rotating: removing $excess oldest version(s) (keeping max $max)"
    
    # Create array of "num:file" pairs, sort by num, delete the lowest
    local sorted=()
    for i in "${!files[@]}"; do
      sorted+=("${nums[$i]}:${files[$i]}")
    done
    
    IFS=$'\n' sorted=($(sort -t: -k1 -n <<< "${sorted[*]}")); unset IFS
    
    for ((i=0; i<excess; i++)); do
      local file_to_delete="${sorted[$i]#*:}"
      echo "  🗑️  Deleting: $(basename "$file_to_delete")"
      if [[ "$DRY_RUN" == false ]]; then
        rm -f "$file_to_delete"
      fi
    done
  fi
}

# --- Main: Process each document ---
get_system_metrics

TOTAL_CREATED=0

for doc_name in "${!DOCS[@]}"; do
  source_file="${DOCS[$doc_name]}"
  
  echo "📄 Processing: $doc_name"
  
  if [[ ! -f "$source_file" ]]; then
    echo "  ❌ Source file not found: $source_file"
    echo ""
    continue
  fi
  
  # Get version number
  next_version=$(get_next_version "$doc_name")
  prev_file=$(get_previous_version_file "$doc_name")
  
  # Build output filename
  output_file="$VERSIONS_DIR/${doc_name}-v${next_version}-${DATE_EST}-${COMMIT_SHORT}.md"
  
  echo "  Version:  v${next_version}"
  echo "  Output:   $(basename "$output_file")"
  [[ -n "$prev_file" ]] && echo "  Previous: $(basename "$prev_file")"
  
  # Check if content actually changed since last version
  if [[ -n "$prev_file" && -f "$prev_file" ]]; then
    # Strip metadata header (everything between <!-- and -->) from previous for comparison
    prev_content=$(sed '/^<!--$/,/^-->$/d' "$prev_file")
    curr_content=$(cat "$source_file")
    
    if [[ "$prev_content" == "$curr_content" ]]; then
      echo "  ⏭️  SKIPPED — no changes since v$((next_version - 1))"
      echo ""
      continue
    fi
  fi
  
  if [[ "$DRY_RUN" == false ]]; then
    # Build metadata header + append file content
    build_metadata_header "$doc_name" "$next_version" "$prev_file" > "$output_file"
    cat "$source_file" >> "$output_file"
    
    echo "  ✅ Created: $(basename "$output_file") ($(wc -l < "$output_file" | tr -d ' ') lines)"
    TOTAL_CREATED=$((TOTAL_CREATED + 1))
    
    # Rotate old versions
    rotate_versions "$doc_name" "$MAX_VERSIONS"
  else
    echo "  🔍 Would create: $(basename "$output_file")"
  fi
  
  echo ""
done

echo "============================================================"
echo "  Summary"
echo "============================================================"
if [[ "$DRY_RUN" == true ]]; then
  echo "  Mode: DRY RUN (no changes made)"
else
  echo "  Versions created: $TOTAL_CREATED"
  echo "  Location: docs/architecture-versions/"
  if [[ -d "$VERSIONS_DIR" ]]; then
    echo ""
    echo "  Current archive:"
    ls -1t "$VERSIONS_DIR"/*.md 2>/dev/null | while read -r f; do
      echo "    $(basename "$f")"
    done
  fi
fi
echo "============================================================"
