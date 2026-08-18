const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

let Database;
try {
  Database = require('better-sqlite3');
} catch (error) {
  console.warn('SkillsStore: better-sqlite3 not available:', error.message);
}

function slugify(value) {
  return String(value || 'skill')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'skill';
}

class SkillsStore {
  constructor() {
    this.db = null;
    this.skillsDir = null;
    this.dbPath = null;
  }

  /**
   * @param {string} userDataPath
   */
  initialize(userDataPath) {
    if (!Database) {
      throw new Error('better-sqlite3 is not installed.');
    }

    this.skillsDir = path.join(userDataPath, 'skills');
    this.dbPath = path.join(userDataPath, 'buddy-skills.db');

    fs.mkdirSync(this.skillsDir, { recursive: true });

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        domain TEXT,
        tags_json TEXT NOT NULL DEFAULT '[]',
        file_path TEXT NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_used_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
      CREATE INDEX IF NOT EXISTS idx_skills_title ON skills(title);
      CREATE INDEX IF NOT EXISTS idx_skills_updated_at ON skills(updated_at DESC);
    `);
  }

  getSkillsFolderPath() {
    return this.skillsDir;
  }

  getDatabasePath() {
    return this.dbPath;
  }

  ensureReady() {
    if (!this.db || !this.skillsDir) {
      throw new Error('SkillsStore is not initialized.');
    }
  }

  readSkillFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return '';
    }
  }

  mapRow(row, includeContent = false) {
    const skill = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      domain: row.domain,
      tags: JSON.parse(row.tags_json || '[]'),
      filePath: row.file_path,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastUsedAt: row.last_used_at,
    };

    if (includeContent) {
      skill.contentMd = this.readSkillFile(row.file_path);
    }

    return skill;
  }

  listSkills() {
    this.ensureReady();
    const rows = this.db
      .prepare('SELECT * FROM skills ORDER BY updated_at DESC')
      .all();
    return rows.map((row) => this.mapRow(row, false));
  }

  getSkill(idOrSlug) {
    this.ensureReady();
    const row = this.db
      .prepare('SELECT * FROM skills WHERE id = ? OR slug = ?')
      .get(idOrSlug, idOrSlug);

    if (!row) {
      return null;
    }

    return this.mapRow(row, true);
  }

  createUniqueSlug(title, existingId = null) {
    const base = slugify(title);
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = this.db.prepare('SELECT id FROM skills WHERE slug = ?').get(slug);
      if (!existing || (existingId && existing.id === existingId)) {
        return slug;
      }
      counter += 1;
      slug = `${base}-${counter}`;
    }
  }

  /**
   * @param {{ id?: string, title: string, contentMd: string, domain?: string, tags?: string[] }} input
   */
  saveSkill(input) {
    this.ensureReady();

    const now = new Date().toISOString();
    const existing = input.id
      ? this.db.prepare('SELECT * FROM skills WHERE id = ?').get(input.id)
      : null;

    const id = existing?.id || randomUUID();
    const slug = this.createUniqueSlug(input.title, id);
    const skillDir = path.join(this.skillsDir, slug);
    const filePath = path.join(skillDir, 'skill.md');

    if (existing && existing.slug !== slug) {
      const oldDir = path.dirname(existing.file_path);
      if (oldDir !== skillDir && fs.existsSync(oldDir)) {
        fs.rmSync(oldDir, { recursive: true, force: true });
      }
    }

    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(filePath, input.contentMd, 'utf8');

    const tagsJson = JSON.stringify(input.tags || []);
    const domain = input.domain || null;

    if (existing) {
      this.db
        .prepare(`
          UPDATE skills
          SET title = ?, slug = ?, domain = ?, tags_json = ?, file_path = ?, updated_at = ?
          WHERE id = ?
        `)
        .run(input.title, slug, domain, tagsJson, filePath, now, id);
    } else {
      this.db
        .prepare(`
          INSERT INTO skills (
            id, title, slug, domain, tags_json, file_path, usage_count,
            created_at, updated_at, last_used_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL)
        `)
        .run(id, input.title, slug, domain, tagsJson, filePath, now, now);
    }

    return this.getSkill(id);
  }

  deleteSkill(idOrSlug) {
    this.ensureReady();
    const existing = this.getSkill(idOrSlug);
    if (!existing) {
      return false;
    }

    const skillDir = path.dirname(existing.filePath);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
    }

    this.db.prepare('DELETE FROM skills WHERE id = ?').run(existing.id);
    return true;
  }

  recordUsage(idOrSlug) {
    this.ensureReady();
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`
        UPDATE skills
        SET usage_count = usage_count + 1, last_used_at = ?, updated_at = ?
        WHERE id = ? OR slug = ?
      `)
      .run(now, now, idOrSlug, idOrSlug);

    return result.changes > 0;
  }
}

module.exports = { SkillsStore };
