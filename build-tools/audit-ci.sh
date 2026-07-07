#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Running security audit against npm public registry..."

# Read allowlist from .audit-ci.json
ALLOWLIST_FILE=".audit-ci.json"

if [ ! -f "$ALLOWLIST_FILE" ]; then
  echo -e "${RED}ERROR: $ALLOWLIST_FILE not found${NC}"
  exit 1
fi

CURRENT_DATE=$(date +%Y-%m-%d)

# Run npm audit and capture output
AUDIT_OUTPUT=$(npm audit --json --registry=https://registry.npmjs.org/ 2>/dev/null || true)

if ! echo "$AUDIT_OUTPUT" | jq empty >/dev/null 2>&1; then
  echo -e "${RED}ERROR: npm audit did not return valid JSON. Check registry connectivity and npm output.${NC}"
  exit 1
fi

read_config_expiration() {
  local section="$1"
  local key="$2"

  jq -r --arg section "$section" --arg key "$key" '
    .[$section][$key] // empty |
    if type == "string" then .
    elif type == "object" then (.expiresOn // .expires // empty)
    else empty
    end
  ' "$ALLOWLIST_FILE"
}

read_config_reason() {
  local section="$1"
  local key="$2"

  jq -r --arg section "$section" --arg key "$key" '
    .[$section][$key] // empty |
    if type == "object" then (.reason // empty)
    else empty
    end
  ' "$ALLOWLIST_FILE"
}

package_advisory_ids() {
  local package="$1"

  echo "$AUDIT_OUTPUT" | jq -r --arg package "$package" '
    . as $audit |

    def advisory_ids($pkg):
      if ($audit.vulnerabilities[$pkg] // null) == null then []
      else
        [($audit.vulnerabilities[$pkg].via // [])[]? |
          if type == "object" then
            (try ((.url // "") | capture("(?<id>GHSA-[A-Za-z0-9-]+)").id) catch empty)
          elif type == "string" then
            advisory_ids(.)[]
          else
            empty
          end
        ] | unique
      end;

    advisory_ids($package)[]?
  '
}

# Check if there are vulnerabilities
MODERATE_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.moderate // 0')
HIGH_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high // 0')
CRITICAL_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical // 0')

TOTAL_ISSUES=$((MODERATE_COUNT + HIGH_COUNT + CRITICAL_COUNT))

if [ "$TOTAL_ISSUES" -eq 0 ]; then
  echo -e "${GREEN}✓ No security vulnerabilities found${NC}"
  exit 0
fi

echo -e "${YELLOW}Found $TOTAL_ISSUES vulnerabilities (moderate or higher)${NC}"

# Check if all vulnerable packages are in allowlist
VULNERABLE_PACKAGES=$(echo "$AUDIT_OUTPUT" | jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "moderate" or .value.severity == "high" or .value.severity == "critical") | .key')
BLOCKED_PACKAGES=()

for package in $VULNERABLE_PACKAGES; do
  SEVERITY=$(echo "$AUDIT_OUTPUT" | jq -r ".vulnerabilities[\"$package\"].severity")
  
  # Skip if severity is low or info
  if [[ "$SEVERITY" == "low" || "$SEVERITY" == "info" ]]; then
    continue
  fi
  
  mapfile -t ADVISORY_IDS < <(package_advisory_ids "$package")
  GHSA_EVALUATED=false
  GHSA_BLOCKED=false
  GHSA_MATCH_FOUND=false

  if [ ${#ADVISORY_IDS[@]} -gt 0 ]; then
    GHSA_EVALUATED=true

    for advisory_id in "${ADVISORY_IDS[@]}"; do
      EXPIRES=$(read_config_expiration "advisory-allowlist" "$advisory_id")
      REASON=$(read_config_reason "advisory-allowlist" "$advisory_id")

      if [ -z "$EXPIRES" ]; then
        echo -e "${RED}✗ Package '$package' ($SEVERITY) is affected by advisory '$advisory_id' and it is NOT in advisory-allowlist${NC}"
        GHSA_BLOCKED=true
      elif [[ "$EXPIRES" < "$CURRENT_DATE" ]]; then
        echo -e "${RED}✗ Package '$package' ($SEVERITY) advisory '$advisory_id' allowlist expired on $EXPIRES${NC}"
        GHSA_BLOCKED=true
        GHSA_MATCH_FOUND=true
      else
        GHSA_MATCH_FOUND=true

        if [ -n "$REASON" ]; then
          echo -e "${YELLOW}⚠ Package '$package' ($SEVERITY) allowed by advisory '$advisory_id' until $EXPIRES — $REASON${NC}"
        else
          echo -e "${YELLOW}⚠ Package '$package' ($SEVERITY) allowed by advisory '$advisory_id' until $EXPIRES${NC}"
        fi
      fi
    done
  fi

  if [ "$GHSA_EVALUATED" = true ] && [ "$GHSA_MATCH_FOUND" = true ] && [ "$GHSA_BLOCKED" = false ]; then
    continue
  fi

  EXPIRES=$(read_config_expiration "package-allowlist" "$package")
  REASON=$(read_config_reason "package-allowlist" "$package")

  if [ -n "$EXPIRES" ] && { [ "$GHSA_EVALUATED" = false ] || [ "$GHSA_MATCH_FOUND" = false ]; }; then
    if [[ "$EXPIRES" < "$CURRENT_DATE" ]]; then
      echo -e "${RED}✗ Package '$package' ($SEVERITY) package allowlist expired on $EXPIRES${NC}"
      BLOCKED_PACKAGES+=("$package")
    else
      if [ -n "$REASON" ]; then
        echo -e "${YELLOW}⚠ Package '$package' ($SEVERITY) allowed by package allowlist until $EXPIRES — $REASON${NC}"
      else
        echo -e "${YELLOW}⚠ Package '$package' ($SEVERITY) allowed by package allowlist until $EXPIRES${NC}"
      fi
    fi
    continue
  fi

  if [ "$GHSA_BLOCKED" = true ]; then
    BLOCKED_PACKAGES+=("$package")
  else
    echo -e "${RED}✗ Package '$package' ($SEVERITY) is NOT in allowlist${NC}"
    BLOCKED_PACKAGES+=("$package")
  fi
done

# Show full audit report
echo ""
echo "Full audit report:"
npm audit --registry=https://registry.npmjs.org/ || true

# Exit with error if there are blocked packages
if [ ${#BLOCKED_PACKAGES[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}ERROR: Security audit failed. ${#BLOCKED_PACKAGES[@]} package(s) have unallowlisted or expired advisories.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ All vulnerabilities are in allowlist and not expired${NC}"
exit 0
