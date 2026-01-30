# Contributing Guide

## Repository Organization

This repository follows a strict folder structure to keep files organized. When creating new files, **always place them in the appropriate folder**.

### Folder Structure

| Folder | Purpose | File Types |
|--------|---------|------------|
| `docs/guides/` | User-facing guides and tutorials | `.md` |
| `docs/api/` | API reference documentation | `.md` |
| `docs/architecture/` | System design and architecture docs | `.md` |
| `docs/salesforce/` | Salesforce integration documentation | `.md` |
| `docs/analysis/` | Data analysis reports and studies | `.md` |
| `session-notes/` | Development session summaries | `.md` |
| `examples/` | Code examples and samples | `.ts`, `.js`, `.md` |
| `postman/` | Postman collections | `.json` |
| `audit-results/` | Audit results and analysis data | `.json` |
| `test-data/` | Test fixtures and sample data | `.json`, `.csv` |
| `scripts/` | Utility and maintenance scripts | `.js`, `.ts` |
| `src/` | Application source code | `.ts` |
| `logs/` | Application logs | `.log` |

### Rules

#### ✅ DO
- Place documentation in the appropriate `docs/` subfolder
- Keep session notes in `session-notes/`
- Store audit results and analysis JSON in `audit-results/`
- Add Postman collections to `postman/`
- Put code examples in `examples/`
- Create README.md files in folders to explain contents

#### ❌ DON'T
- Create markdown files in the root directory
- Mix documentation types in the same folder
- Leave JSON data files in the root
- Create new top-level folders without discussion

### Creating New Documentation

When creating new documentation:

1. **Determine the type**:
   - User guide? → `docs/guides/`
   - API documentation? → `docs/api/`
   - Architecture/design? → `docs/architecture/`
   - Salesforce-specific? → `docs/salesforce/`
   - Analysis/report? → `docs/analysis/`

2. **Follow naming conventions**:
   - Use UPPERCASE-WITH-HYPHENS.md for documentation
   - Use descriptive names that indicate content
   - Update the folder's README.md to list the new file

3. **Update indexes**:
   - Add entry to the folder's README.md
   - Update `docs/README.md` if it's a major document

### Session Notes

Development session summaries should:
- Go in `session-notes/`
- Follow format: `SESSION-SUMMARY-YYYY-MM-DD.md` or `SESSION-SUMMARY-YYYY-MM-DD-DESCRIPTOR.md`
- Include: work completed, files modified, commits, status, next steps
- Update `session-notes/README.md` with the new entry

### Audit Results & Analysis Data

JSON files containing analysis data or audit results:
- Go in `audit-results/`
- Use descriptive names
- Update `audit-results/README.md` to document the file

### Maintenance

Each organized folder has a README.md that:
- Lists contents
- Explains purpose
- Provides quick links to important files

When adding files to a folder, update its README.md.

## Code Contributions

### Branch Strategy
- `main` - Production-ready code
- Feature branches - `feature/description`
- Bugfix branches - `bugfix/description`

### Commit Messages
Follow conventional commits:
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Refactor code
test: Add tests
chore: Maintenance tasks
```

### Pull Requests
- Ensure all tests pass
- Update relevant documentation
- Follow the folder structure guidelines
- Reference related issues

## Questions?

If you're unsure where a file belongs, check:
1. The folder structure table above
2. Similar existing files
3. The folder README.md files
4. Ask in the pull request or issue

**Golden Rule**: Keep the root directory clean. Only configuration files, package files, and the main README.md belong at the root level.
