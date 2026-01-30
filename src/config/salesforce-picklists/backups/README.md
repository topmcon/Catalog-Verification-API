# Picklist Backups

This folder contains automatic backups of picklist files created before syncing from production.

## Backup Format

Files are named: `{filename}.backup.{YYYYMMDD}`

Example: `styles.json.backup.20260130`

## When Backups Are Created

Backups are automatically created by:
- `scripts/sync-picklists-from-production.js` - Before syncing from production server

## Cleanup

Old backups can be safely deleted once you've confirmed the new data is correct.
They are kept here for reference in case you need to revert changes.
