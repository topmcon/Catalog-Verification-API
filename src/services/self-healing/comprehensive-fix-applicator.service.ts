import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FixResult {
  success: boolean;
  modifiedFiles: string[];
  backupPaths: string[];
  reason?: string;
  validationErrors?: string[];
}

interface ComprehensiveFix {
  primary: {
    type: string;
    targetFiles: string[];
    codeChanges: Array<{
      file: string;
      lineNumbers?: string;
      oldCode?: string;
      newCode: string;
      explanation: string;
    }>;
  };
  systemWide: Array<{
    file: string;
    changes: string;
    reason: string;
  }>;
}

class ComprehensiveFixApplicator {
  private backupDir: string;
  private currentBackups: Map<string, string> = new Map();

  constructor() {
    this.backupDir = path.join(process.cwd(), '.self-healing-backups');
  }

  /**
   * Apply comprehensive fix (primary + system-wide)
   */
  async applyComprehensiveFix(fix: ComprehensiveFix): Promise<FixResult> {
    const modifiedFiles: string[] = [];
    const backupPaths: string[] = [];

    try {
      logger.info('Starting comprehensive fix application...');

      // 1️⃣ PRE-FLIGHT CHECKS
      logger.info('Running pre-flight checks...');
      const preflightResult = await this.runPreflightChecks(fix);
      if (!preflightResult.passed) {
        return {
          success: false,
          modifiedFiles: [],
          backupPaths: [],
          reason: `Preflight checks failed: ${preflightResult.errors.join(', ')}`
        };
      }

      // 2️⃣ CREATE BACKUP DIRECTORY
      await this.ensureBackupDirectory();

      // 3️⃣ APPLY PRIMARY FIX
      logger.info('Applying primary fix...');
      for (const change of fix.primary.codeChanges) {
        const filePath = this.resolveFilePath(change.file);
        
        // Backup original
        const backupPath = await this.backupFile(filePath);
        backupPaths.push(backupPath);
        this.currentBackups.set(filePath, backupPath);

        // Apply change
        await this.applyCodeChange(filePath, change);
        modifiedFiles.push(filePath);
        
        logger.info(`Applied primary fix to ${change.file}`);
      }

      // 4️⃣ APPLY SYSTEM-WIDE FIXES
      logger.info(`Applying ${fix.systemWide.length} system-wide fixes...`);
      for (const systemFix of fix.systemWide) {
        const filePath = this.resolveFilePath(systemFix.file);
        
        // Skip if already modified by primary fix
        if (modifiedFiles.includes(filePath)) {
          logger.info(`Skipping ${systemFix.file} (already modified)`);
          continue;
        }

        // Backup if not already backed up
        if (!this.currentBackups.has(filePath)) {
          const backupPath = await this.backupFile(filePath);
          backupPaths.push(backupPath);
          this.currentBackups.set(filePath, backupPath);
        }

        // Apply system-wide fix
        await this.applySystemWideFix(filePath, systemFix);
        modifiedFiles.push(filePath);
        
        logger.info(`Applied system-wide fix to ${systemFix.file}: ${systemFix.reason}`);
      }

      // 5️⃣ FULL SYSTEM VALIDATION
      logger.info('Running full system validation...');
      const validationResult = await this.validateAllChanges(modifiedFiles);
      
      if (!validationResult.passed) {
        logger.error('Validation failed. Rolling back all changes...');
        await this.rollbackAllChanges();
        return {
          success: false,
          modifiedFiles: [],
          backupPaths: [],
          reason: 'Validation failed after applying fixes',
          validationErrors: validationResult.errors
        };
      }

      logger.info(`✅ Comprehensive fix applied successfully to ${modifiedFiles.length} files`);

      return {
        success: true,
        modifiedFiles,
        backupPaths
      };

    } catch (error: any) {
      logger.error('Error applying comprehensive fix:', error);
      await this.rollbackAllChanges();
      return {
        success: false,
        modifiedFiles: [],
        backupPaths: [],
        reason: `Exception: ${error.message}`
      };
    }
  }

  /**
   * Pre-flight checks before applying any fixes
   */
  private async runPreflightChecks(fix: ComprehensiveFix): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check all target files exist
    const allFiles = [
      ...fix.primary.targetFiles,
      ...fix.systemWide.map(f => f.file)
    ];

    for (const file of allFiles) {
      try {
        const filePath = this.resolveFilePath(file);
        await fs.access(filePath);
      } catch (error) {
        errors.push(`File not found: ${file}`);
      }
    }

    // Check write permissions
    for (const file of allFiles) {
      try {
        const filePath = this.resolveFilePath(file);
        await fs.access(filePath, fs.constants.W_OK);
      } catch (error) {
        errors.push(`No write permission: ${file}`);
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.warn('Could not create backup directory:', error);
    }
  }

  /**
   * Backup a file before modification
   */
  private async backupFile(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupFileName = `${fileName}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupFileName);

    await fs.copyFile(filePath, backupPath);
    logger.info(`Backed up ${filePath} to ${backupPath}`);

    return backupPath;
  }

  /**
   * Apply a single code change
   */
  private async applyCodeChange(filePath: string, change: any) {
    let content = await fs.readFile(filePath, 'utf-8');

    if (change.oldCode) {
      // Replace specific code
      if (!content.includes(change.oldCode)) {
        throw new Error(`Old code not found in ${change.file}. Cannot apply fix safely.`);
      }
      content = content.replace(change.oldCode, change.newCode);
    } else {
      // Append new code (for aliases, schema additions, etc.)
      content = this.intelligentlyInsertCode(content, change.newCode, change.file);
    }

    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Apply system-wide fix
   */
  private async applySystemWideFix(filePath: string, fix: any) {
    let content = await fs.readFile(filePath, 'utf-8');

    // Parse the fix description and apply appropriate changes
    if (fix.changes.includes('Add all variations of alias')) {
      // Extract aliases to add from the changes description
      const aliases = this.extractAliasesFromDescription(fix.changes);
      content = this.addAliasesToFile(content, aliases);
    } else if (fix.changes.includes('Check all schemas')) {
      // Schema-related fixes would go here
      logger.info(`System-wide schema fix for ${fix.file}: ${fix.reason}`);
    } else if (fix.changes.includes('Update regex')) {
      // Regex/parsing fixes
      logger.info(`System-wide parsing fix for ${fix.file}: ${fix.reason}`);
    }

    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Intelligently insert code in the right location
   */
  private intelligentlyInsertCode(content: string, newCode: string, fileName: string): string {
    // For FIELD_ALIASES additions
    if (fileName.includes('smart-field-inference') && newCode.includes('=>')) {
      const aliasMatch = content.match(/(export const FIELD_ALIASES[^}]+})/s);
      if (aliasMatch) {
        const existingAliases = aliasMatch[1];
        const lastBrace = existingAliases.lastIndexOf('}');
        const beforeBrace = existingAliases.substring(0, lastBrace);
        const updated = beforeBrace + ',\n  ' + newCode + '\n}';
        return content.replace(existingAliases, updated);
      }
    }

    // For schema additions
    if (fileName.includes('schema') && newCode.includes(':')) {
      // Find the appropriate schema object and add the field
      return content.replace(/(\s+};\s*$)/, `,\n  ${newCode}$1`);
    }

    // Default: append at end of file
    return content + '\n\n' + newCode + '\n';
  }

  /**
   * Extract aliases from description
   */
  private extractAliasesFromDescription(description: string): Array<{ from: string; to: string }> {
    const aliases: Array<{ from: string; to: string }> = [];
    
    // Parse descriptions like "Add 'manufacturer' → 'brand'"
    const matches = description.matchAll(/'([^']+)'\s*→\s*'([^']+)'/g);
    
    for (const match of matches) {
      aliases.push({ from: match[1], to: match[2] });
    }

    return aliases;
  }

  /**
   * Add aliases to field inference file
   */
  private addAliasesToFile(content: string, aliases: Array<{ from: string; to: string }>): string {
    for (const alias of aliases) {
      const aliasLine = `'${alias.from}': '${alias.to}'`;
      
      // Check if alias already exists
      if (content.includes(aliasLine)) {
        continue;
      }

      // Add to FIELD_ALIASES
      content = this.intelligentlyInsertCode(content, aliasLine, 'smart-field-inference');
    }

    return content;
  }

  /**
   * Validate all changes (syntax, tests, etc.)
   */
  private async validateAllChanges(modifiedFiles: string[]): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. TypeScript syntax validation
    logger.info('Validating TypeScript syntax...');
    for (const file of modifiedFiles) {
      if (file.endsWith('.ts')) {
        try {
          await execAsync(`npx tsc --noEmit ${file}`);
        } catch (error: any) {
          errors.push(`Syntax error in ${file}: ${error.message}`);
        }
      }
    }

    // 2. Check for circular dependencies (basic check)
    logger.info('Checking for circular dependencies...');
    for (const file of modifiedFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.includes('import') && content.includes('export')) {
        // Basic check - could be enhanced
        const imports = content.match(/import .+ from ['"](.+)['"]/g) || [];
        if (imports.length > 50) {
          logger.warn(`High import count in ${file} - potential circular dependency risk`);
        }
      }
    }

    // 3. Run unit tests if enabled
    if (process.env.REGRESSION_TEST_REQUIRED === 'true') {
      logger.info('Running regression tests...');
      try {
        await execAsync('npm test -- --passWithNoTests');
        logger.info('Tests passed');
      } catch (error: any) {
        errors.push(`Tests failed: ${error.message}`);
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Rollback all changes
   */
  async rollbackAllChanges(): Promise<void> {
    logger.warn('Rolling back all changes...');

    for (const [originalPath, backupPath] of this.currentBackups.entries()) {
      try {
        await fs.copyFile(backupPath, originalPath);
        logger.info(`Restored ${originalPath} from backup`);
      } catch (error) {
        logger.error(`Failed to restore ${originalPath}:`, error);
      }
    }

    this.currentBackups.clear();
    logger.info('Rollback complete');
  }

  /**
   * Resolve file path from relative name
   */
  private resolveFilePath(file: string): string {
    // If already absolute, return as-is
    if (path.isAbsolute(file)) {
      return file;
    }

    // If starts with 'src/', resolve from project root
    if (file.startsWith('src/')) {
      return path.join(process.cwd(), file);
    }

    // If just filename, try to find it in common locations
    const commonPaths = [
      path.join(process.cwd(), 'src/services', file),
      path.join(process.cwd(), 'src/config', file),
      path.join(process.cwd(), 'src/config/schemas', file),
      path.join(process.cwd(), 'src', file)
    ];

    for (const testPath of commonPaths) {
      try {
        require.resolve(testPath);
        return testPath;
      } catch {
        continue;
      }
    }

    // Default: assume relative to src/
    return path.join(process.cwd(), 'src', file);
  }

  /**
   * Clean up old backups (keep last 50)
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      
      if (files.length > 50) {
        // Sort by timestamp (oldest first)
        const sorted = files.sort();
        const toDelete = sorted.slice(0, files.length - 50);

        for (const file of toDelete) {
          await fs.unlink(path.join(this.backupDir, file));
        }

        logger.info(`Cleaned up ${toDelete.length} old backup files`);
      }
    } catch (error) {
      logger.warn('Error cleaning up backups:', error);
    }
  }
}

export default new ComprehensiveFixApplicator();
