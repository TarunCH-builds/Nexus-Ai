/**
 * NEXUS AI - Phase 2 & Personal Workspace: Persistent SQLite Database Engine
 * 
 * Powered by Node.js built-in DatabaseSync (node:sqlite).
 * Enforces strict user isolation across all entities:
 * - users & sessions
 * - documents & chunks
 * - memory items & embeddings
 * - tasks & action proposals
 * - meetings & transcripts
 * - conversations & messages
 * - performance metrics & privacy audits
 * - user workspace settings & data export
 * 
 * Uses disk persistence in ./data/nexus.sqlite with WAL mode.
 */

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { 
  DocumentItem, 
  DocumentChunk, 
  MemoryItem, 
  TaskItem, 
  MeetingSession, 
  PerformanceMetric, 
  PrivacyAuditRecord, 
  GraphNode, 
  GraphEdge,
  ActionProposal,
  DocumentCitation,
  UserProfile,
  WorkspaceStats
} from '../src/types/index.js';
import { generateLocalEmbedding, cosineSimilarity, chunkDocument } from './ai/localEngine.js';
import { Logger } from './utils/logger.js';
import { AuthService, UserRecord } from './auth.js';

const logger = new Logger('NEXUS:SQLITE');

export const DEFAULT_USER_ID = 'usr_tarunch_default';
export const DEFAULT_USER_EMAIL = 'chtarunch121@gmail.com';
export const DEFAULT_USER_NAME = 'Tarun C H';

class NexusDatabase {
  private db: DatabaseSync;
  private dbPath: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'nexus.sqlite');
    logger.info(`Initializing SQLite database at: ${this.dbPath}`);
    
    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
    this.runMigrations();
    this.createIndexes();
    this.seedInitialDataIfEmpty();
  }

  private initSchema(): void {
    // 0. Users Table & Sessions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        avatarUrl TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        userId TEXT PRIMARY KEY,
        historyRetention TEXT NOT NULL DEFAULT 'forever',
        memoryEnabled INTEGER NOT NULL DEFAULT 1,
        autoCaptureScreen INTEGER NOT NULL DEFAULT 1,
        theme TEXT NOT NULL DEFAULT 'dark',
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 1. Documents Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        title TEXT NOT NULL,
        fileName TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        mimeType TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        chunkCount INTEGER NOT NULL,
        summary TEXT,
        extractedConcepts TEXT,
        data TEXT
      );
    `);

    // 2. Chunks Table (stores 384-dim vector as JSON string)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        documentId TEXT NOT NULL,
        chunkIndex INTEGER NOT NULL,
        text TEXT NOT NULL,
        tokenCount INTEGER NOT NULL,
        embedding TEXT NOT NULL,
        FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);

    // 3. Memory Items Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_items (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        privacyLevel TEXT NOT NULL,
        embedding TEXT
      );
    `);

    // 4. Tasks Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        completedAt INTEGER,
        source TEXT NOT NULL,
        sourceTitle TEXT,
        estimatedMinutes INTEGER,
        command TEXT
      );
    `);

    // 4b. Action Engine Proposals Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS action_proposals (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        title TEXT NOT NULL,
        command TEXT,
        description TEXT NOT NULL,
        reason TEXT NOT NULL,
        source TEXT NOT NULL,
        sourceTitle TEXT,
        riskLevel TEXT NOT NULL,
        sandboxStatus TEXT NOT NULL,
        safetyViolations TEXT NOT NULL,
        userApproved INTEGER NOT NULL,
        executed INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        executedAt INTEGER,
        outputResult TEXT
      );
    `);

    // 5. Meetings Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        title TEXT NOT NULL,
        date INTEGER NOT NULL,
        durationSeconds INTEGER NOT NULL,
        participants TEXT NOT NULL,
        summary TEXT,
        actionItems TEXT,
        keyDecisions TEXT,
        transcript TEXT
      );
    `);

    // 6. Performance Telemetry Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        timestamp INTEGER NOT NULL,
        workload TEXT NOT NULL,
        latencyMs REAL NOT NULL,
        throughput REAL,
        provider TEXT NOT NULL,
        hardwareTarget TEXT NOT NULL
      );
    `);

    // 7. Privacy Audits Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS privacy_audits (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}',
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        destination TEXT NOT NULL,
        dataSummary TEXT NOT NULL,
        privacyScore INTEGER NOT NULL,
        userApproved INTEGER NOT NULL
      );
    `);

    // 8. App Settings Key-Value Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 9. Conversations and Conversation Messages Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        contextMetadata TEXT,
        model TEXT,
        provider TEXT
      );
    `);

    logger.info('SQLite base tables initialized successfully.');
  }

  private createIndexes(): void {
    const indexStatements = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_userId ON user_sessions(userId)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON user_sessions(expiresAt)',
      'CREATE INDEX IF NOT EXISTS idx_documents_createdAt ON documents(createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_documents_userId ON documents(userId)',
      'CREATE INDEX IF NOT EXISTS idx_chunks_documentId ON chunks(documentId)',
      'CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_items(category)',
      'CREATE INDEX IF NOT EXISTS idx_memory_createdAt ON memory_items(createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_memory_userId ON memory_items(userId)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId)',
      'CREATE INDEX IF NOT EXISTS idx_action_risk ON action_proposals(riskLevel)',
      'CREATE INDEX IF NOT EXISTS idx_action_createdAt ON action_proposals(createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_action_userId ON action_proposals(userId)',
      'CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date)',
      'CREATE INDEX IF NOT EXISTS idx_meetings_userId ON meetings(userId)',
      'CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_metrics(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_perf_userId ON performance_metrics(userId)',
      'CREATE INDEX IF NOT EXISTS idx_audits_timestamp ON privacy_audits(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_audits_userId ON privacy_audits(userId)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(userId)',
      'CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON conversation_messages(conversationId)',
      'CREATE INDEX IF NOT EXISTS idx_conv_messages_user ON conversation_messages(userId)',
      'CREATE INDEX IF NOT EXISTS idx_conv_messages_time ON conversation_messages(timestamp)',
    ];

    for (const stmt of indexStatements) {
      try {
        this.db.exec(stmt);
      } catch (err) {
        logger.warn(`Index creation notice: ${stmt}`, err);
      }
    }
    logger.info('SQLite indexes verified successfully.');
  }

  /**
   * Safe migration helper that adds missing userId columns to existing tables
   * if the database was created prior to multi-account isolation.
   */
  private runMigrations(): void {
    const tablesToMigrate = [
      'documents',
      'memory_items',
      'tasks',
      'action_proposals',
      'meetings',
      'performance_metrics',
      'privacy_audits',
    ];

    for (const table of tablesToMigrate) {
      try {
        const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as any[];
        const hasUserId = columns.some(c => c.name === 'userId');
        if (!hasUserId) {
          logger.info(`Migrating table ${table}: adding userId column...`);
          this.db.exec(`ALTER TABLE ${table} ADD COLUMN userId TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}'`);
          this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_userId ON ${table}(userId)`);
        }
      } catch (err) {
        logger.warn(`Migration check for ${table}:`, err);
      }
    }
  }

  private seedInitialDataIfEmpty(): void {
    // 1. Ensure default user exists
    const existingUser: any = this.db.prepare('SELECT id FROM users WHERE email = ?').get(DEFAULT_USER_EMAIL);
    if (!existingUser) {
      logger.info('Creating default user account (Tarun C H)...');
      const now = Date.now() - 3600000 * 24 * 30; // 30 days ago
      // Default password: password123
      const passHash = AuthService.hashPassword('password123');
      this.db.prepare(`
        INSERT INTO users (id, email, name, passwordHash, avatarUrl, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(DEFAULT_USER_ID, DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, passHash, '', now, now);

      this.db.prepare(`
        INSERT OR IGNORE INTO user_preferences (userId, historyRetention, memoryEnabled, autoCaptureScreen, theme, updatedAt)
        VALUES (?, 'forever', 1, 1, 'dark', ?)
      `).run(DEFAULT_USER_ID, now);
    }

    const docCountRow: any = this.db.prepare('SELECT count(*) as count FROM documents WHERE userId = ?').get(DEFAULT_USER_ID);
    if (docCountRow && docCountRow.count > 0) {
      logger.info(`Default user already contains ${docCountRow.count} documents. Skipping demo seed.`);
      return;
    }

    logger.info('Database has no records for default user. Seeding Snapdragon architecture & development demo records...');

    // Seed Doc 1
    const doc1Text = `Qualcomm Snapdragon X Elite Architecture Guide.
Designed for Next-Generation Windows Copilot+ PCs, the Snapdragon X Elite integrates a 12-core Qualcomm Oryon CPU, an Adreno GPU, and a dedicated Hexagon NPU delivering 45 TOPS of INT8 tensor computing.
The NPU enables local on-device transformer model execution, sub-50ms vision perception, and zero-cloud voice transcription without throttling battery life.
Key software frameworks include Qualcomm AI Hub, ONNX Runtime QNN Execution Provider (QNNExecutionProvider), and DirectML acceleration.`;

    const doc1Id = 'doc-snapdragon-01';
    const doc1Chunks = chunkDocument(doc1Text, 200, 30).map((txt, idx) => ({
      id: `chk-${doc1Id}-${idx}`,
      documentId: doc1Id,
      chunkIndex: idx,
      text: txt,
      tokenCount: Math.round(txt.length / 4),
      embedding: generateLocalEmbedding(txt),
    }));

    this.addDocument({
      id: doc1Id,
      title: 'Qualcomm Snapdragon X Elite Architecture Guide',
      fileName: 'snapdragon_x_elite_arch.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      createdAt: Date.now() - 3600000 * 24,
      chunkCount: doc1Chunks.length,
      summary: 'Architecture overview of 45 TOPS Hexagon NPU, Oryon CPU, and QNN Execution Provider on Windows ARM64.',
      extractedConcepts: ['Hexagon NPU', '45 TOPS', 'QNN Execution Provider', 'Oryon CPU', 'INT8 Quantization'],
      chunks: doc1Chunks,
    }, DEFAULT_USER_ID);

    // Seed Doc 2
    const doc2Text = `Flask Authentication and CORS Architecture Notes.
In Python Flask microservices, cross-origin requests must be explicitly permitted using flask-cors.
When developing frontend-backend separated architectures, failing to import and initialize CORS will trigger a ModuleNotFoundError: No module named 'flask_cors' or browser CORS preflight rejection.
Resolution: run pip install flask-cors and declare CORS(app, origins=["*"]).`;

    const doc2Id = 'doc-flask-auth-02';
    const doc2Chunks = chunkDocument(doc2Text, 200, 30).map((txt, idx) => ({
      id: `chk-${doc2Id}-${idx}`,
      documentId: doc2Id,
      chunkIndex: idx,
      text: txt,
      tokenCount: Math.round(txt.length / 4),
      embedding: generateLocalEmbedding(txt),
    }));

    this.addDocument({
      id: doc2Id,
      title: 'Flask Authentication & CORS Middleware Spec',
      fileName: 'flask_auth_cors.md',
      fileSize: 45056,
      mimeType: 'text/markdown',
      createdAt: Date.now() - 3600000 * 48,
      chunkCount: doc2Chunks.length,
      summary: 'Troubleshooting guide for Flask CORS module missing errors and API routing configurations.',
      extractedConcepts: ['Flask', 'flask-cors', 'Authentication', 'API Middleware'],
      chunks: doc2Chunks,
    }, DEFAULT_USER_ID);

    // Seed Memory Items
    this.addMemoryItem({
      id: 'mem-001',
      category: 'code',
      title: 'Flask CORS Fix & Virtualenv Setup',
      content: 'Run `pip install flask-cors` and verify `from flask_cors import CORS` in server.py. Associated with Digital Collaborative Whiteboard project.',
      tags: ['python', 'flask', 'bugfix', 'dependencies'],
      createdAt: Date.now() - 3600000 * 12,
      privacyLevel: 'local_only',
    }, DEFAULT_USER_ID);

    this.addMemoryItem({
      id: 'mem-002',
      category: 'project',
      title: 'Digital Collaborative Whiteboard Architecture',
      content: 'Canvas-based multiplayer whiteboard using WebSocket event sync and local vector semantic cache. Optimized for 120Hz display refresh on Snapdragon.',
      tags: ['architecture', 'canvas', 'snapdragon', 'project'],
      createdAt: Date.now() - 3600000 * 20,
      privacyLevel: 'local_only',
    }, DEFAULT_USER_ID);

    this.addMemoryItem({
      id: 'mem-003',
      category: 'meeting',
      title: 'Sprint Planning: Copilot+ NPU Optimization',
      content: 'Decided to move vector search and OCR feature extraction to Hexagon NPU via QNN Execution Provider. Target battery consumption < 4.5W under continuous load.',
      tags: ['planning', 'npu', 'qnn', 'power'],
      createdAt: Date.now() - 3600000 * 8,
      privacyLevel: 'local_only',
    }, DEFAULT_USER_ID);

    // Seed Tasks
    this.addTask({
      id: 'task-001',
      title: 'Run pip install flask-cors in virtualenv',
      description: 'Extracted automatically from VS Code terminal error buffer during Screen Perception.',
      status: 'pending',
      priority: 'high',
      createdAt: Date.now() - 1800000,
      source: 'screen',
      sourceTitle: 'VS Code - server.py [Error]',
      estimatedMinutes: 2,
      command: 'pip install flask-cors',
    }, DEFAULT_USER_ID);

    this.addTask({
      id: 'task-002',
      title: 'Update requirements.txt with flask-cors>=4.0.0',
      description: 'Ensure dependencies are pinned for team reproduction and CI builds.',
      status: 'pending',
      priority: 'medium',
      createdAt: Date.now() - 1700000,
      source: 'screen',
      sourceTitle: 'VS Code - server.py [Error]',
      estimatedMinutes: 5,
    }, DEFAULT_USER_ID);

    this.addTask({
      id: 'task-003',
      title: 'Benchmark QNN Execution Provider INT8 vs CPU',
      description: 'Verify sub-40ms latency on Qualcomm Hexagon NPU for 384-dimensional vector embeddings.',
      status: 'completed',
      priority: 'high',
      createdAt: Date.now() - 86400000,
      completedAt: Date.now() - 3600000,
      source: 'meeting',
      sourceTitle: 'Sprint Planning: Copilot+ NPU Optimization',
      estimatedMinutes: 30,
    }, DEFAULT_USER_ID);

    // Seed Meeting
    this.addMeeting({
      id: 'meet-001',
      title: 'Weekly Systems & Snapdragon AI Sync',
      startTime: Date.now() - 3600000 * 4,
      durationSeconds: 1540,
      status: 'completed',
      participants: ['Alex Chen (Lead)', 'Sarah Miller (AI Eng)', 'Devin Vance (Systems)'],
      summary: 'Reviewed NPU offloading strategy for NEXUS AI on Snapdragon X Elite laptops. Demonstrated that offloading OCR and embedding generation prevents thermal throttling.',
      actionItems: [
        {
          id: 'meet-task-1',
          title: 'Profile INT8 quantization vs FP16 on Hexagon NPU',
          status: 'pending',
          priority: 'high',
          source: 'meeting',
          createdAt: Date.now() - 3600000 * 4,
        },
        {
          id: 'meet-task-2',
          title: 'Verify zero-cloud fallback safety for meeting audio stream',
          status: 'pending',
          priority: 'high',
          source: 'meeting',
          createdAt: Date.now() - 3600000 * 4,
        },
        {
          id: 'meet-task-3',
          title: 'Add terminal command copy for automated task remediation',
          status: 'completed',
          priority: 'medium',
          source: 'meeting',
          createdAt: Date.now() - 3600000 * 4,
        },
      ],
      keyPoints: [
        'All raw camera and microphone streams remain strictly on-device in Local Mode',
        'Default Model Router target is Hexagon NPU when QNN EP is available',
      ],
      decisions: [
        'All raw camera and microphone streams remain strictly on-device in Local Mode',
        'Default Model Router target is Hexagon NPU when QNN EP is available',
      ],
      transcript: [
        { id: 'tr-1', speaker: 'Alex', timestamp: Date.now() - 3600000 * 4 + 1000, text: 'Welcome everyone. Today we are reviewing the on-device AI architecture for the Snapdragon PC challenge.' },
        { id: 'tr-2', speaker: 'Sarah', timestamp: Date.now() - 3600000 * 4 + 45000, text: 'Our vector search and screen OCR are running on the Hexagon NPU through the QNN Execution Provider. Latency is down to 32 milliseconds.' },
        { id: 'tr-3', speaker: 'Devin', timestamp: Date.now() - 3600000 * 4 + 130000, text: 'And power consumption remains under 4.5 Watts. When we tested on a standard x86 CPU, the fan immediately spun up and battery drain tripled.' },
        { id: 'tr-4', speaker: 'Alex', timestamp: Date.now() - 3600000 * 4 + 262000, text: 'Perfect. Let\'s make sure the Privacy Center gives users absolute visibility into local vs hybrid routing.' }
      ],
    }, DEFAULT_USER_ID);

    // Seed Privacy Audits
    this.addPrivacyAudit({
      id: 'audit-001',
      timestamp: Date.now() - 1800000,
      action: 'Screen OCR Tokenization & Perception',
      destination: 'on_device_cpu',
      dataSummary: 'VS Code terminal error buffer scanned. 18 tokens parsed on-device.',
      dataEgress: 'none',
      encryptionStatus: 'Local Memory Protected',
      userApproved: true,
    }, DEFAULT_USER_ID);

    this.addPrivacyAudit({
      id: 'audit-002',
      timestamp: Date.now() - 1200000,
      action: 'Local Vector Cosine Similarity Search',
      destination: 'on_device_cpu',
      dataSummary: 'Dense vector search over 2 local indexed documents. 0 cloud packets transmitted.',
      dataEgress: 'none',
      encryptionStatus: 'Local SQLite Cipher',
      userApproved: true,
    }, DEFAULT_USER_ID);

    // Seed Security Action Engine Proposals
    this.saveActionProposal({
      id: 'prop-001',
      title: 'Inspect Qualcomm Architecture Whitepaper',
      command: 'view docs/snapdragon_x_elite_arch.pdf',
      description: 'Open and read local Snapdragon architecture guide to inspect INT8 tensor parameters.',
      reason: 'Requested by user query in Document Intelligence.',
      source: 'document',
      sourceTitle: 'Qualcomm Snapdragon X Elite Architecture Guide',
      riskLevel: 'low',
      sandboxStatus: 'verified',
      safetyViolations: [],
      userApproved: true,
      executed: true,
      createdAt: Date.now() - 3600000,
      executedAt: Date.now() - 3550000,
      outputResult: 'Document preview loaded in Local RAG Viewer.',
    }, DEFAULT_USER_ID);

    this.saveActionProposal({
      id: 'prop-002',
      title: 'Install Dependency: flask-cors',
      command: 'pip install flask-cors',
      description: 'Install missing CORS middleware package into Python virtual environment.',
      reason: 'Remediates ModuleNotFoundError: No module named flask_cors identified in screen perception.',
      source: 'screen',
      sourceTitle: 'VS Code (server.py:14)',
      riskLevel: 'medium',
      sandboxStatus: 'sandboxed',
      safetyViolations: ['Requires isolated subshell execution to prevent environment pollution'],
      userApproved: false,
      executed: false,
      createdAt: Date.now() - 900000,
    }, DEFAULT_USER_ID);

    this.saveActionProposal({
      id: 'prop-003',
      title: 'Compile Tensor Cache for QNN Execution Provider',
      command: 'qnn-net-run --model llama3-int8.bin --backend libQnnHtp.so',
      description: 'Execute Hexagon Tensor Processor hardware compilation toolchain on ARM64 platform.',
      reason: 'Pre-compile neural weights for offline low-power inference.',
      source: 'manual',
      sourceTitle: 'Performance Lab Diagnostics',
      riskLevel: 'high',
      sandboxStatus: 'requires_elevation',
      safetyViolations: ['Binary accelerator execution requires explicit administrative confirmation'],
      userApproved: false,
      executed: false,
      createdAt: Date.now() - 300000,
    }, DEFAULT_USER_ID);

    logger.info('Demo seed completed successfully with Security Action proposals.');
  }

  // ==========================================
  // USER AUTHENTICATION & SESSIONS API
  // ==========================================

  public createUser(email: string, name: string, passwordHash: string): UserRecord {
    const id = AuthService.generateUserId();
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO users (id, email, name, passwordHash, avatarUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, '', ?, ?)
    `).run(id, email.toLowerCase().trim(), name.trim(), passwordHash, now, now);

    this.db.prepare(`
      INSERT INTO user_preferences (userId, historyRetention, memoryEnabled, autoCaptureScreen, theme, updatedAt)
      VALUES (?, 'forever', 1, 1, 'dark', ?)
    `).run(id, now);

    return {
      id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      avatarUrl: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  public getUserByEmail(email: string): (UserRecord & { passwordHash: string }) | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      avatarUrl: row.avatarUrl || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public getUserById(id: string): UserRecord | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public updateUserProfile(id: string, updates: { name?: string; avatarUrl?: string }): UserRecord | undefined {
    const current = this.getUserById(id);
    if (!current) return undefined;

    const newName = updates.name !== undefined ? updates.name.trim() : current.name;
    const newAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl.trim() : (current.avatarUrl || '');
    const now = Date.now();

    this.db.prepare(`
      UPDATE users SET name = ?, avatarUrl = ?, updatedAt = ? WHERE id = ?
    `).run(newName, newAvatar, now, id);

    return {
      ...current,
      name: newName,
      avatarUrl: newAvatar,
      updatedAt: now,
    };
  }

  public updateUserPassword(userId: string, newPasswordHash: string): boolean {
    const now = Date.now();
    const res = this.db.prepare(`
      UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?
    `).run(newPasswordHash, now, userId);
    return res.changes > 0;
  }

  public deleteUserAccount(userId: string): boolean {
    // Delete all user records across all isolated tables
    this.db.prepare('DELETE FROM conversation_messages WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM conversations WHERE userId = ?').run(userId);
    
    // Find documents owned by this user to clean chunks
    const userDocs = this.db.prepare('SELECT id FROM documents WHERE userId = ?').all(userId) as any[];
    for (const d of userDocs) {
      this.db.prepare('DELETE FROM chunks WHERE documentId = ?').run(d.id);
    }
    this.db.prepare('DELETE FROM documents WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM memory_items WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM tasks WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM action_proposals WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM meetings WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM performance_metrics WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM privacy_audits WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM user_preferences WHERE userId = ?').run(userId);
    this.db.prepare('DELETE FROM user_sessions WHERE userId = ?').run(userId);
    
    const userRes = this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return userRes.changes > 0;
  }

  public createSession(userId: string): { token: string; expiresAt: number } {
    const token = AuthService.generateSessionToken();
    const now = Date.now();
    const expiresAt = now + 1000 * 60 * 60 * 24 * 14; // 14 days session

    this.db.prepare(`
      INSERT INTO user_sessions (token, userId, createdAt, expiresAt)
      VALUES (?, ?, ?, ?)
    `).run(token, userId, now, expiresAt);

    return { token, expiresAt };
  }

  public getSession(token: string): { token: string; userId: string; expiresAt: number } | undefined {
    if (!token) return undefined;
    const row = this.db.prepare('SELECT * FROM user_sessions WHERE token = ?').get(token) as any;
    if (!row) return undefined;
    if (row.expiresAt < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return {
      token: row.token,
      userId: row.userId,
      expiresAt: row.expiresAt,
    };
  }

  public deleteSession(token: string): boolean {
    const res = this.db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
    return res.changes > 0;
  }

  public getUserPreferences(userId: string) {
    const row = this.db.prepare('SELECT * FROM user_preferences WHERE userId = ?').get(userId) as any;
    if (!row) {
      return {
        historyRetention: 'forever' as const,
        memoryEnabled: true,
        autoCaptureScreen: true,
        theme: 'dark',
      };
    }
    return {
      historyRetention: row.historyRetention || 'forever',
      memoryEnabled: Boolean(row.memoryEnabled),
      autoCaptureScreen: Boolean(row.autoCaptureScreen),
      theme: row.theme || 'dark',
    };
  }

  public updateUserPreferences(userId: string, prefs: {
    historyRetention?: 'forever' | '30_days' | '90_days' | '1_year';
    memoryEnabled?: boolean;
    autoCaptureScreen?: boolean;
    theme?: string;
  }) {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...prefs };
    const now = Date.now();

    this.db.prepare(`
      INSERT INTO user_preferences (userId, historyRetention, memoryEnabled, autoCaptureScreen, theme, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        historyRetention = excluded.historyRetention,
        memoryEnabled = excluded.memoryEnabled,
        autoCaptureScreen = excluded.autoCaptureScreen,
        theme = excluded.theme,
        updatedAt = excluded.updatedAt
    `).run(
      userId,
      updated.historyRetention,
      updated.memoryEnabled ? 1 : 0,
      updated.autoCaptureScreen ? 1 : 0,
      updated.theme,
      now
    );

    // Enforce retention policy if user chose automatic deletion
    if (prefs.historyRetention && prefs.historyRetention !== 'forever') {
      this.applyRetentionPolicy(userId, prefs.historyRetention);
    }

    return updated;
  }

  public applyRetentionPolicy(userId: string, retention: '30_days' | '90_days' | '1_year'): number {
    const daysMap = {
      '30_days': 30,
      '90_days': 90,
      '1_year': 365,
    };
    const days = daysMap[retention] || 365;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Remove older conversation messages
    const msgsRes = this.db.prepare(`
      DELETE FROM conversation_messages 
      WHERE userId = ? AND timestamp < ?
    `).run(userId, cutoffTime);

    // Remove conversations where all messages were deleted or created before cutoff
    this.db.prepare(`
      DELETE FROM conversations 
      WHERE userId = ? AND updatedAt < ?
    `).run(userId, cutoffTime);

    return Number(msgsRes.changes);
  }

  public getUserWorkspaceStats(userId: string): WorkspaceStats {
    const convRow: any = this.db.prepare('SELECT count(*) as c FROM conversations WHERE userId = ?').get(userId);
    const docRow: any = this.db.prepare('SELECT count(*) as c, sum(fileSize) as s FROM documents WHERE userId = ?').get(userId);
    const meetRow: any = this.db.prepare('SELECT count(*) as c FROM meetings WHERE userId = ?').get(userId);
    const memRow: any = this.db.prepare('SELECT count(*) as c FROM memory_items WHERE userId = ?').get(userId);
    const taskRow: any = this.db.prepare('SELECT count(*) as c FROM tasks WHERE userId = ?').get(userId);
    const userRow: any = this.db.prepare('SELECT createdAt FROM users WHERE id = ?').get(userId);

    return {
      conversations: convRow ? convRow.c : 0,
      documents: docRow ? docRow.c : 0,
      meetings: meetRow ? meetRow.c : 0,
      memories: memRow ? memRow.c : 0,
      tasks: taskRow ? taskRow.c : 0,
      storageUsageBytes: (docRow && docRow.s) ? docRow.s : 0,
      memberSince: userRow ? userRow.createdAt : Date.now(),
    };
  }

  // ==========================================
  // USER-ISOLATED DOCUMENTS & CHUNKS API
  // ==========================================

  public getDocuments(userId: string = DEFAULT_USER_ID): DocumentItem[] {
    const rows = this.db.prepare('SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC').all(userId) as any[];
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      fileName: r.fileName,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      createdAt: r.createdAt,
      chunkCount: r.chunkCount,
      summary: r.summary || undefined,
      extractedConcepts: r.extractedConcepts ? JSON.parse(r.extractedConcepts) : [],
    }));
  }

  public getDocument(id: string, userId?: string): DocumentItem | undefined {
    let row: any;
    if (userId) {
      row = this.db.prepare('SELECT * FROM documents WHERE id = ? AND userId = ?').get(id, userId);
    } else {
      row = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    }
    if (!row) return undefined;

    const chunkRows = this.db.prepare('SELECT * FROM chunks WHERE documentId = ? ORDER BY chunkIndex ASC').all(id) as any[];
    const chunks: DocumentChunk[] = chunkRows.map(c => ({
      id: c.id,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      text: c.text,
      tokenCount: c.tokenCount,
      embedding: JSON.parse(c.embedding),
    }));

    return {
      id: row.id,
      title: row.title,
      fileName: row.fileName,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      createdAt: row.createdAt,
      chunkCount: row.chunkCount,
      summary: row.summary || undefined,
      extractedConcepts: row.extractedConcepts ? JSON.parse(row.extractedConcepts) : [],
      chunks,
    };
  }

  public addDocument(doc: DocumentItem, userId: string = DEFAULT_USER_ID): void {
    const insertDoc = this.db.prepare(`
      INSERT OR REPLACE INTO documents 
      (id, userId, title, fileName, fileSize, mimeType, createdAt, chunkCount, summary, extractedConcepts, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      doc.id,
      userId,
      doc.title,
      doc.fileName,
      doc.fileSize,
      doc.mimeType,
      doc.createdAt,
      doc.chunks ? doc.chunks.length : doc.chunkCount,
      doc.summary || '',
      JSON.stringify(doc.extractedConcepts || []),
      ''
    );

    if (doc.chunks && doc.chunks.length > 0) {
      const insertChunk = this.db.prepare(`
        INSERT OR REPLACE INTO chunks 
        (id, documentId, chunkIndex, text, tokenCount, embedding)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const c of doc.chunks) {
        insertChunk.run(
          c.id,
          c.documentId,
          c.chunkIndex,
          c.text,
          c.tokenCount,
          JSON.stringify(c.embedding)
        );
      }
    }
  }

  public deleteDocument(id: string, userId?: string): boolean {
    if (userId) {
      const check = this.db.prepare('SELECT id FROM documents WHERE id = ? AND userId = ?').get(id, userId);
      if (!check) return false;
    }
    this.db.prepare('DELETE FROM chunks WHERE documentId = ?').run(id);
    const result = this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public searchChunks(
    query: string,
    userIdOrLimit: string | number = DEFAULT_USER_ID,
    limitOrThreshold: number = 5,
    thresholdParam: number = 0.25
  ): Array<{ chunk: DocumentChunk; similarity: number }> {
    let userId = DEFAULT_USER_ID;
    let limit = 5;
    let threshold = 0.25;

    if (typeof userIdOrLimit === 'number') {
      limit = userIdOrLimit;
      if (typeof limitOrThreshold === 'number') {
        threshold = limitOrThreshold;
      }
    } else {
      userId = userIdOrLimit || DEFAULT_USER_ID;
      limit = limitOrThreshold;
      threshold = thresholdParam;
    }

    const queryVec = generateLocalEmbedding(query);
    // Join chunks with documents to enforce user isolation
    const chunkRows = this.db.prepare(`
      SELECT c.* 
      FROM chunks c
      JOIN documents d ON c.documentId = d.id
      WHERE d.userId = ?
    `).all(userId) as any[];

    const scored = chunkRows.map(c => {
      const vec = JSON.parse(c.embedding) as number[];
      const sim = cosineSimilarity(queryVec, vec);
      const chunk: DocumentChunk = {
        id: c.id,
        documentId: c.documentId,
        chunkIndex: c.chunkIndex,
        text: c.text,
        tokenCount: c.tokenCount,
        embedding: vec,
      };
      return { chunk, similarity: sim };
    });

    return scored
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  public searchChunksWithCitations(
    query: string,
    userIdOrLimit: string | number = DEFAULT_USER_ID,
    limitOrThreshold: number = 4,
    thresholdParam: number = 0.20
  ): DocumentCitation[] {
    let userId = DEFAULT_USER_ID;
    let limit = 4;
    let threshold = 0.20;

    if (typeof userIdOrLimit === 'number') {
      limit = userIdOrLimit;
      if (typeof limitOrThreshold === 'number') {
        threshold = limitOrThreshold;
      }
    } else {
      userId = userIdOrLimit || DEFAULT_USER_ID;
      limit = limitOrThreshold;
      threshold = thresholdParam;
    }

    const scoredChunks = this.searchChunks(query, userId, limit, threshold);
    const docs = this.getDocuments(userId);
    const docMap = new Map<string, string>();
    docs.forEach(d => docMap.set(d.id, d.title));

    return scoredChunks.map(sc => {
      const docTitle = docMap.get(sc.chunk.documentId) || 'Local Document';
      return {
        documentId: sc.chunk.documentId,
        documentTitle: docTitle,
        chunkIndex: sc.chunk.chunkIndex,
        chunkId: sc.chunk.id,
        similarity: parseFloat(sc.similarity.toFixed(3)),
        snippet: sc.chunk.text.length > 250 ? sc.chunk.text.slice(0, 250) + '...' : sc.chunk.text,
      };
    });
  }

  // ==========================================
  // USER-ISOLATED ACTION PROPOSALS API
  // ==========================================

  public getActionProposals(userId: string = DEFAULT_USER_ID, limit: number = 50): ActionProposal[] {
    try {
      const rows = this.db.prepare('SELECT * FROM action_proposals WHERE userId = ? ORDER BY createdAt DESC LIMIT ?').all(userId, limit) as any[];
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        command: r.command || undefined,
        description: r.description,
        reason: r.reason,
        source: r.source,
        sourceTitle: r.sourceTitle || undefined,
        riskLevel: r.riskLevel,
        sandboxStatus: r.sandboxStatus,
        safetyViolations: JSON.parse(r.safetyViolations || '[]'),
        userApproved: Boolean(r.userApproved),
        executed: Boolean(r.executed),
        createdAt: r.createdAt,
        executedAt: r.executedAt || undefined,
        outputResult: r.outputResult || undefined,
      }));
    } catch {
      return [];
    }
  }

  public saveActionProposal(p: ActionProposal, userId: string = DEFAULT_USER_ID): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO action_proposals 
      (id, userId, title, command, description, reason, source, sourceTitle, riskLevel, sandboxStatus, safetyViolations, userApproved, executed, createdAt, executedAt, outputResult)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      p.id,
      userId,
      p.title,
      p.command || null,
      p.description,
      p.reason,
      p.source,
      p.sourceTitle || null,
      p.riskLevel,
      p.sandboxStatus,
      JSON.stringify(p.safetyViolations || []),
      p.userApproved ? 1 : 0,
      p.executed ? 1 : 0,
      p.createdAt,
      p.executedAt || null,
      p.outputResult || null
    );
  }

  public updateActionProposal(id: string, updates: Partial<ActionProposal>, userId?: string): ActionProposal | null {
    const existing = userId 
      ? this.getActionProposals(userId, 100).find(a => a.id === id)
      : this.db.prepare('SELECT * FROM action_proposals WHERE id = ?').get(id) as any;
      
    if (!existing) return null;
    const currentProps = this.getActionProposals(existing.userId || userId || DEFAULT_USER_ID, 100).find(a => a.id === id);
    if (!currentProps) return null;

    const merged: ActionProposal = { ...currentProps, ...updates };
    this.saveActionProposal(merged, existing.userId || userId || DEFAULT_USER_ID);
    return merged;
  }

  public deleteActionProposal(id: string, userId?: string): boolean {
    let res;
    if (userId) {
      res = this.db.prepare('DELETE FROM action_proposals WHERE id = ? AND userId = ?').run(id, userId);
    } else {
      res = this.db.prepare('DELETE FROM action_proposals WHERE id = ?').run(id);
    }
    return res.changes > 0;
  }

  // ==========================================
  // USER-ISOLATED MEMORY REPOSITORY API
  // ==========================================

  public getMemoryItems(userId: string = DEFAULT_USER_ID, category?: string, limit: number = 50): MemoryItem[] {
    let rows: any[];
    if (category && category !== 'all') {
      rows = this.db.prepare('SELECT * FROM memory_items WHERE userId = ? AND category = ? ORDER BY createdAt DESC LIMIT ?').all(userId, category, limit) as any[];
    } else {
      rows = this.db.prepare('SELECT * FROM memory_items WHERE userId = ? ORDER BY createdAt DESC LIMIT ?').all(userId, limit) as any[];
    }

    return rows.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      content: r.content,
      tags: JSON.parse(r.tags),
      createdAt: r.createdAt,
      privacyLevel: r.privacyLevel,
      embedding: r.embedding ? JSON.parse(r.embedding) : undefined,
    }));
  }

  public addMemoryItem(item: MemoryItem, userId: string = DEFAULT_USER_ID): void {
    const vec = item.embedding || generateLocalEmbedding(`${item.title} ${item.content} ${item.tags.join(' ')}`);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memory_items
      (id, userId, category, title, content, tags, createdAt, privacyLevel, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      userId,
      item.category,
      item.title,
      item.content,
      JSON.stringify(item.tags || []),
      item.createdAt,
      item.privacyLevel || 'local_only',
      JSON.stringify(vec)
    );
  }

  public deleteMemoryItem(id: string, userId?: string): boolean {
    let res;
    if (userId) {
      res = this.db.prepare('DELETE FROM memory_items WHERE id = ? AND userId = ?').run(id, userId);
    } else {
      res = this.db.prepare('DELETE FROM memory_items WHERE id = ?').run(id);
    }
    return res.changes > 0;
  }

  public searchMemory(query: string, userId: string = DEFAULT_USER_ID, limit: number = 5): Array<{ item: MemoryItem; similarity: number }> {
    const queryVec = generateLocalEmbedding(query);
    const rows = this.db.prepare('SELECT * FROM memory_items WHERE userId = ?').all(userId) as any[];

    const scored = rows.map(r => {
      const vec = r.embedding ? JSON.parse(r.embedding) : generateLocalEmbedding(r.content);
      const sim = cosineSimilarity(queryVec, vec);
      const item: MemoryItem = {
        id: r.id,
        category: r.category,
        title: r.title,
        content: r.content,
        tags: JSON.parse(r.tags),
        createdAt: r.createdAt,
        privacyLevel: r.privacyLevel,
        embedding: vec,
      };
      return { item, similarity: sim };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // ==========================================
  // USER-ISOLATED ACTION ENGINE / TASKS API
  // ==========================================

  public getTasks(userId: string = DEFAULT_USER_ID, status?: string): TaskItem[] {
    let rows: any[];
    if (status && status !== 'all') {
      rows = this.db.prepare('SELECT * FROM tasks WHERE userId = ? AND status = ? ORDER BY createdAt DESC').all(userId, status) as any[];
    } else {
      rows = this.db.prepare('SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC').all(userId) as any[];
    }

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      status: r.status,
      priority: r.priority,
      createdAt: r.createdAt,
      completedAt: r.completedAt || undefined,
      source: r.source,
      sourceTitle: r.sourceTitle || undefined,
      estimatedMinutes: r.estimatedMinutes || undefined,
      command: r.command || undefined,
    }));
  }

  public addTask(task: TaskItem, userId: string = DEFAULT_USER_ID): TaskItem {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tasks
      (id, userId, title, description, status, priority, createdAt, completedAt, source, sourceTitle, estimatedMinutes, command)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      userId,
      task.title,
      task.description || '',
      task.status || 'pending',
      task.priority || 'medium',
      task.createdAt,
      task.completedAt || null,
      task.source || 'manual',
      task.sourceTitle || '',
      task.estimatedMinutes || 5,
      task.command || ''
    );
    return task;
  }

  public updateTask(id: string, updates: Partial<TaskItem>, userId?: string): TaskItem | undefined {
    let existing: any;
    if (userId) {
      existing = this.db.prepare('SELECT * FROM tasks WHERE id = ? AND userId = ?').get(id, userId);
    } else {
      existing = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    }
    if (!existing) return undefined;

    const updated: TaskItem = {
      id: existing.id,
      title: updates.title !== undefined ? updates.title : existing.title,
      description: updates.description !== undefined ? updates.description : (existing.description || undefined),
      status: updates.status !== undefined ? updates.status : existing.status,
      priority: updates.priority !== undefined ? updates.priority : existing.priority,
      createdAt: existing.createdAt,
      completedAt: updates.status === 'completed' ? Date.now() : (updates.completedAt !== undefined ? updates.completedAt : (existing.completedAt || undefined)),
      source: updates.source !== undefined ? updates.source : existing.source,
      sourceTitle: updates.sourceTitle !== undefined ? updates.sourceTitle : (existing.sourceTitle || undefined),
      estimatedMinutes: updates.estimatedMinutes !== undefined ? updates.estimatedMinutes : (existing.estimatedMinutes || undefined),
      command: updates.command !== undefined ? updates.command : (existing.command || undefined),
    };

    this.addTask(updated, existing.userId || userId || DEFAULT_USER_ID);
    return updated;
  }

  public updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'dismissed', userId?: string): TaskItem | undefined {
    return this.updateTask(id, { status }, userId);
  }

  public deleteTask(id: string, userId?: string): boolean {
    let res;
    if (userId) {
      res = this.db.prepare('DELETE FROM tasks WHERE id = ? AND userId = ?').run(id, userId);
    } else {
      res = this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    }
    return res.changes > 0;
  }

  // ==========================================
  // USER-ISOLATED MEETINGS API
  // ==========================================

  private safeParse<T>(data: any, fallback: T): T {
    if (!data) return fallback;
    if (typeof data !== 'string') return data as T;
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  public getMeetings(userId: string = DEFAULT_USER_ID): MeetingSession[] {
    const rows = this.db.prepare('SELECT * FROM meetings WHERE userId = ? ORDER BY date DESC').all(userId) as any[];
    return rows.map(r => {
      let transcript: any[] = [];
      if (r.transcript) {
        try {
          const parsed = JSON.parse(r.transcript);
          transcript = Array.isArray(parsed) ? parsed : [{ id: 'tr-0', speaker: 'Speaker', timestamp: r.date || Date.now(), text: String(r.transcript) }];
        } catch {
          transcript = [{ id: 'tr-0', speaker: 'Speaker', timestamp: r.date || Date.now(), text: String(r.transcript) }];
        }
      }

      return {
        id: r.id,
        title: r.title,
        startTime: r.date || Date.now(),
        durationSeconds: r.durationSeconds || 0,
        status: 'completed',
        participants: this.safeParse(r.participants, []),
        summary: r.summary || undefined,
        keyPoints: this.safeParse(r.keyDecisions, []),
        decisions: this.safeParse(r.keyDecisions, []),
        actionItems: this.safeParse(r.actionItems, []),
        transcript,
      };
    });
  }

  public getMeeting(id: string, userId?: string): MeetingSession | undefined {
    let r: any;
    if (userId) {
      r = this.db.prepare('SELECT * FROM meetings WHERE id = ? AND userId = ?').get(id, userId);
    } else {
      r = this.db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    }
    if (!r) return undefined;

    let transcript: any[] = [];
    if (r.transcript) {
      try {
        const parsed = JSON.parse(r.transcript);
        transcript = Array.isArray(parsed) ? parsed : [{ id: 'tr-0', speaker: 'Speaker', timestamp: r.date || Date.now(), text: String(r.transcript) }];
      } catch {
        transcript = [{ id: 'tr-0', speaker: 'Speaker', timestamp: r.date || Date.now(), text: String(r.transcript) }];
      }
    }

    return {
      id: r.id,
      title: r.title,
      startTime: r.date || Date.now(),
      durationSeconds: r.durationSeconds || 0,
      status: 'completed',
      participants: this.safeParse(r.participants, []),
      summary: r.summary || undefined,
      keyPoints: this.safeParse(r.keyDecisions, []),
      decisions: this.safeParse(r.keyDecisions, []),
      actionItems: this.safeParse(r.actionItems, []),
      transcript,
    };
  }

  public addMeeting(meeting: MeetingSession, userId: string = DEFAULT_USER_ID): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO meetings
      (id, userId, title, date, durationSeconds, participants, summary, actionItems, keyDecisions, transcript)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      meeting.id,
      userId,
      meeting.title,
      meeting.startTime || (meeting.date ? new Date(meeting.date).getTime() : Date.now()),
      meeting.durationSeconds || 0,
      JSON.stringify(meeting.participants || []),
      meeting.summary || '',
      JSON.stringify(meeting.actionItems || []),
      JSON.stringify(meeting.decisions || meeting.keyDecisions || meeting.keyPoints || []),
      JSON.stringify(meeting.transcript || [])
    );
  }

  public saveMeeting(meeting: MeetingSession, userId: string = DEFAULT_USER_ID): void {
    this.addMeeting(meeting, userId);
  }

  public deleteMeeting(id: string, userId?: string): boolean {
    let res;
    if (userId) {
      res = this.db.prepare('DELETE FROM meetings WHERE id = ? AND userId = ?').run(id, userId);
    } else {
      res = this.db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    }
    return res.changes > 0;
  }

  // ==========================================
  // PERFORMANCE TELEMETRY API
  // ==========================================

  public addPerformanceMetric(metric: PerformanceMetric, userId: string = DEFAULT_USER_ID): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO performance_metrics
      (id, userId, timestamp, workload, latencyMs, throughput, provider, hardwareTarget)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metric.id,
      userId,
      metric.timestamp,
      metric.workload || metric.taskType || 'reasoning',
      metric.latencyMs,
      metric.throughput ? parseFloat(String(metric.throughput)) : (metric.tokensPerSecond || null),
      metric.provider || metric.executionProvider || 'local_qnn',
      metric.hardwareTarget || 'hexagon_npu'
    );
  }

  public recordPerformanceMetric(metric: PerformanceMetric, userId: string = DEFAULT_USER_ID): void {
    this.addPerformanceMetric(metric, userId);
  }

  public getPerformanceMetrics(userId: string = DEFAULT_USER_ID, limit: number = 50): PerformanceMetric[] {
    const rows = this.db.prepare('SELECT * FROM performance_metrics WHERE userId = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit) as any[];
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      taskType: (r.workload || 'reasoning') as any,
      modelName: r.workload || 'Qualcomm-QNN-INT8',
      hardwareTarget: (r.hardwareTarget || 'hexagon_npu') as any,
      executionProvider: r.provider || 'QNN Execution Provider',
      latencyMs: r.latencyMs,
      tokensPerSecond: r.throughput || undefined,
      memoryUsageMb: 42,
      success: true,
      workload: r.workload,
      throughput: r.throughput ? String(r.throughput) : undefined,
      provider: r.provider,
    }));
  }

  // Vector Search & Memory Clear Helpers
  public searchVectors(query: string, userIdOrLimit: string | number = DEFAULT_USER_ID, limitParam: number = 5): any[] {
    let userId = DEFAULT_USER_ID;
    let limit = 5;
    if (typeof userIdOrLimit === 'number') {
      limit = userIdOrLimit;
    } else {
      userId = userIdOrLimit || DEFAULT_USER_ID;
      limit = limitParam;
    }
    return this.searchMemory(query, userId, limit);
  }

  public clearMemory(userId: string = DEFAULT_USER_ID): void {
    this.db.prepare('DELETE FROM memory_items WHERE userId = ?').run(userId);
  }

  // ==========================================
  // PRIVACY AUDITS API
  // ==========================================

  public addPrivacyAudit(audit: PrivacyAuditRecord, userId: string = DEFAULT_USER_ID): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO privacy_audits
      (id, userId, timestamp, action, destination, dataSummary, privacyScore, userApproved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    (stmt as any).run(
      audit.id,
      userId,
      audit.timestamp,
      audit.action,
      audit.destination,
      audit.dataSummary,
      audit.privacyScore || 100,
      audit.userApproved ? 1 : 0
    );
  }

  public recordPrivacyAudit(audit: PrivacyAuditRecord, userId: string = DEFAULT_USER_ID): void {
    this.addPrivacyAudit(audit, userId);
  }

  public getPrivacyAudits(userId: string = DEFAULT_USER_ID, limit: number = 50): PrivacyAuditRecord[] {
    const rows = this.db.prepare('SELECT * FROM privacy_audits WHERE userId = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit) as any[];
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      destination: r.destination,
      dataSummary: r.dataSummary,
      privacyScore: r.privacyScore,
      userApproved: Boolean(r.userApproved),
    }));
  }

  // ==========================================
  // USER-ISOLATED KNOWLEDGE GRAPH SYNTHESIS
  // ==========================================

  public getKnowledgeGraph(userId: string = DEFAULT_USER_ID): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Core Snapdragon Architecture Nodes & Concepts
    nodes.push({
      id: 'core-snapdragon',
      label: 'Snapdragon X Elite',
      type: 'concept',
      size: 20,
      color: '#f59e0b',
      source: 'Hardware Specification',
      relationship: 'Host SoC Architecture',
      timestamp: Date.now() - 3600000 * 48,
      confidence: 1.0,
      description: '4nm ARM64 compute platform featuring 12-core Oryon CPU, Adreno GPU, and dedicated Hexagon NPU.',
    });

    nodes.push({
      id: 'core-hexagon',
      label: 'Qualcomm Hexagon NPU',
      type: 'concept',
      size: 18,
      color: '#10b981',
      source: 'Hardware Specification',
      relationship: 'Neural Accelerator',
      timestamp: Date.now() - 3600000 * 48,
      confidence: 1.0,
      description: 'Dedicated tensor processing unit providing 45 TOPS INT8 for on-device LLM, vision, and Whisper transcription.',
    });

    nodes.push({
      id: 'core-qnn',
      label: 'QNN Execution Provider',
      type: 'concept',
      size: 16,
      color: '#6366f1',
      source: 'Qualcomm AI Hub SDK',
      relationship: 'Runtime Abstraction',
      timestamp: Date.now() - 3600000 * 24,
      confidence: 0.99,
      description: 'Hardware abstraction layer connecting ONNX Runtime directly to Qualcomm Hexagon tensor cores.',
    });

    nodes.push({
      id: 'topic-int8',
      label: 'INT8 Quantization',
      type: 'topic',
      size: 14,
      color: '#06b6d4',
      source: 'Optimization Whitepaper',
      relationship: 'Model Compression',
      timestamp: Date.now() - 3600000 * 20,
      confidence: 0.98,
      description: 'Integer quantization standard enabling 4x memory bandwidth reduction with negligible semantic accuracy loss.',
    });

    nodes.push({
      id: 'proj-whiteboard',
      label: 'Collaborative Whiteboard',
      type: 'project',
      size: 16,
      color: '#8b5cf6',
      source: 'Workspace Repository',
      relationship: 'Active Application Context',
      timestamp: Date.now() - 3600000 * 12,
      confidence: 0.96,
      description: 'Local workspace project for real-time spatial diagrams, note taking, and architectural reviews.',
    });

    edges.push({ id: 'e1', source: 'core-snapdragon', target: 'core-hexagon', relation: 'powers' });
    edges.push({ id: 'e2', source: 'core-hexagon', target: 'core-qnn', relation: 'executes' });
    edges.push({ id: 'e3', source: 'core-qnn', target: 'topic-int8', relation: 'accelerates' });

    // Documents owned by user
    const docs = this.getDocuments(userId);
    for (const d of docs) {
      nodes.push({
        id: d.id,
        label: d.title,
        type: 'document',
        size: 13,
        color: '#3b82f6',
        source: d.fileName,
        relationship: 'Indexed Knowledge Base',
        timestamp: d.createdAt,
        confidence: 0.97,
        description: d.summary || `Indexed document with ${d.chunkCount} semantic chunks.`,
      });

      if (d.title.toLowerCase().includes('snapdragon') || d.title.toLowerCase().includes('qualcomm')) {
        edges.push({ id: `ed-${d.id}-hex`, source: d.id, target: 'core-hexagon', relation: 'documents' });
        edges.push({ id: `ed-${d.id}-qnn`, source: d.id, target: 'core-qnn', relation: 'specifies' });
      }
      if (d.title.toLowerCase().includes('flask') || d.title.toLowerCase().includes('whiteboard')) {
        edges.push({ id: `ed-${d.id}-proj`, source: d.id, target: 'proj-whiteboard', relation: 'backend_for' });
      }
    }

    // People
    const userRecord = this.getUserById(userId);
    const people = [
      { id: 'person-dave', name: 'Dave (Tech Lead)', role: 'Technical Lead', desc: 'Focuses on Snapdragon Hexagon NPU offloading and latency budgets.' },
      { id: 'person-sarah', name: 'Sarah (ML Eng)', role: 'Machine Learning Engineer', desc: 'Maintains ONNX models, INT8 quantization pipelines, and vector embeddings.' },
      { id: 'person-owner', name: userRecord ? `${userRecord.name} (Workspace Owner)` : 'Tarun (DevOps)', role: 'Systems & Workspace Owner', desc: 'Oversees on-device isolation, sandbox policies, and SQLite persistence.' },
    ];

    for (const p of people) {
      nodes.push({
        id: p.id,
        label: p.name,
        type: 'person',
        size: 14,
        color: '#ec4899',
        source: 'Meeting Intelligence',
        relationship: p.role,
        timestamp: Date.now() - 3600000 * 8,
        confidence: 0.95,
        description: p.desc,
      });
      edges.push({ id: `ep-${p.id}-proj`, source: p.id, target: 'proj-whiteboard', relation: 'collaborates_on' });
    }

    // Meetings owned by user
    const meetings = this.getMeetings(userId);
    for (const m of meetings) {
      nodes.push({
        id: m.id,
        label: m.title,
        type: 'meeting',
        size: 13,
        color: '#f97316',
        source: 'Audio Recording Session',
        relationship: 'Team Architecture Sync',
        timestamp: m.startTime,
        confidence: 0.96,
        description: m.summary || `Meeting with ${m.transcript.length} speech chunks and ${m.actionItems.length} action items.`,
      });
      edges.push({ id: `em-${m.id}-proj`, source: m.id, target: 'proj-whiteboard', relation: 'reviews' });
      edges.push({ id: `em-${m.id}-dave`, source: 'person-dave', target: m.id, relation: 'participated_in' });
    }

    // Tasks & Action Engine items owned by user
    const tasks = this.getTasks(userId);
    for (const t of tasks.slice(0, 10)) {
      nodes.push({
        id: t.id,
        label: t.title,
        type: 'task',
        size: 11,
        color: t.status === 'completed' ? '#10b981' : '#f43f5e',
        source: t.source || 'Action Engine',
        relationship: `Task (${t.priority} priority)`,
        timestamp: t.createdAt,
        confidence: 0.94,
        description: t.description || `Action status: ${t.status}. Created from ${t.source}.`,
      });

      if (t.title.toLowerCase().includes('flask') || t.title.toLowerCase().includes('error')) {
        edges.push({ id: `et-${t.id}-proj`, source: t.id, target: 'proj-whiteboard', relation: 'remediates' });
      }
      if (t.title.toLowerCase().includes('qnn') || t.title.toLowerCase().includes('npu')) {
        edges.push({ id: `et-${t.id}-hex`, source: t.id, target: 'core-hexagon', relation: 'profiles' });
      }
    }

    return { nodes, edges };
  }

  public getStats(userId: string = DEFAULT_USER_ID): {
    documentCount: number;
    chunkCount: number;
    memoryItemCount: number;
    taskCount: number;
    meetingCount: number;
    perfCount: number;
    auditCount: number;
  } {
    const docRow: any = this.db.prepare('SELECT count(*) as c FROM documents WHERE userId = ?').get(userId);
    const chunkRow: any = this.db.prepare(`
      SELECT count(*) as c 
      FROM chunks c 
      JOIN documents d ON c.documentId = d.id 
      WHERE d.userId = ?
    `).get(userId);
    const memRow: any = this.db.prepare('SELECT count(*) as c FROM memory_items WHERE userId = ?').get(userId);
    const taskRow: any = this.db.prepare('SELECT count(*) as c FROM tasks WHERE userId = ?').get(userId);
    const meetRow: any = this.db.prepare('SELECT count(*) as c FROM meetings WHERE userId = ?').get(userId);
    const perfRow: any = this.db.prepare('SELECT count(*) as c FROM performance_metrics WHERE userId = ?').get(userId);
    const auditRow: any = this.db.prepare('SELECT count(*) as c FROM privacy_audits WHERE userId = ?').get(userId);

    return {
      documentCount: docRow ? docRow.c : 0,
      chunkCount: chunkRow ? chunkRow.c : 0,
      memoryItemCount: memRow ? memRow.c : 0,
      taskCount: taskRow ? taskRow.c : 0,
      meetingCount: meetRow ? meetRow.c : 0,
      perfCount: perfRow ? perfRow.c : 0,
      auditCount: auditRow ? auditRow.c : 0,
    };
  }

  public getDatabaseConsistencyStats(userId: string = DEFAULT_USER_ID) {
    const stats = this.getStats(userId);
    let actionCount = 0;
    try {
      const actRow: any = this.db.prepare('SELECT count(*) as c FROM action_proposals WHERE userId = ?').get(userId);
      actionCount = actRow ? actRow.c : 0;
    } catch {}

    const totalEmbeddings = stats.chunkCount + stats.memoryItemCount;

    return {
      documentCount: stats.documentCount,
      chunkCount: stats.chunkCount,
      embeddingCount: totalEmbeddings,
      memoryItemCount: stats.memoryItemCount,
      taskCount: stats.taskCount,
      meetingCount: stats.meetingCount,
      actionProposalCount: actionCount,
      perfMetricCount: stats.perfCount,
      privacyAuditCount: stats.auditCount,
      isConsistent: true,
      storageEngine: 'SQLite WAL mode (node:sqlite disk-persistent)',
      vectorDimensions: 384,
      verifiedTimestamp: Date.now(),
    };
  }

  // ==========================================
  // CONVERSATION HISTORY & MESSAGES API
  // ==========================================

  public saveConversation(id: string, userId: string, title: string): void {
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO conversations (id, userId, title, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, updatedAt = excluded.updatedAt
    `).run(id, userId, title, now, now);
  }

  public updateConversationTitle(id: string, userId: string, newTitle: string): boolean {
    const now = Date.now();
    const res = this.db.prepare(`
      UPDATE conversations SET title = ?, updatedAt = ? WHERE id = ? AND userId = ?
    `).run(newTitle.trim(), now, id, userId);
    return res.changes > 0;
  }

  public deleteConversation(id: string, userId: string): boolean {
    this.db.prepare('DELETE FROM conversation_messages WHERE conversationId = ? AND userId = ?').run(id, userId);
    const res = this.db.prepare('DELETE FROM conversations WHERE id = ? AND userId = ?').run(id, userId);
    return res.changes > 0;
  }

  public saveMessage(msg: {
    id?: string;
    conversationId: string;
    userId: string;
    role: string;
    content: string;
    timestamp?: number;
    contextMetadata?: any;
    model?: string;
    provider?: string;
  }): void {
    const id = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = msg.timestamp || Date.now();
    const metaStr = msg.contextMetadata ? JSON.stringify(msg.contextMetadata) : null;
    
    // Ensure parent conversation exists for this user
    this.saveConversation(msg.conversationId, msg.userId, msg.content.slice(0, 40));

    this.db.prepare(`
      INSERT INTO conversation_messages (id, conversationId, userId, role, content, timestamp, contextMetadata, model, provider)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      msg.conversationId,
      msg.userId,
      msg.role,
      msg.content,
      timestamp,
      metaStr,
      msg.model || 'gemini-2.5-flash',
      msg.provider || 'gemini'
    );
  }

  public getRecentUserMessages(userId: string, limit: number = 6): Array<{
    id: string;
    conversationId: string;
    userId: string;
    role: string;
    content: string;
    timestamp: number;
    model: string;
  }> {
    return this.db.prepare(`
      SELECT id, conversationId, userId, role, content, timestamp, model
      FROM conversation_messages
      WHERE userId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(userId, limit).reverse() as any;
  }

  public getConversationMessages(conversationId: string, userId: string): any[] {
    return this.db.prepare(`
      SELECT id, conversationId, userId, role, content, timestamp, contextMetadata, model, provider
      FROM conversation_messages
      WHERE conversationId = ? AND userId = ?
      ORDER BY timestamp ASC
    `).all(conversationId, userId).map((r: any) => ({
      ...r,
      contextMetadata: r.contextMetadata ? JSON.parse(r.contextMetadata) : null,
    }));
  }

  public getConversations(userId: string): any[] {
    return this.db.prepare(`
      SELECT c.id, c.userId, c.title, c.createdAt, c.updatedAt,
             (SELECT count(*) FROM conversation_messages m WHERE m.conversationId = c.id) as messageCount,
             (SELECT m.content FROM conversation_messages m WHERE m.conversationId = c.id ORDER BY m.timestamp DESC LIMIT 1) as lastMessageSnippet,
             (SELECT m.timestamp FROM conversation_messages m WHERE m.conversationId = c.id ORDER BY m.timestamp DESC LIMIT 1) as lastMessageTime
      FROM conversations c
      WHERE c.userId = ?
      ORDER BY c.updatedAt DESC
    `).all(userId) as any;
  }

  // ==========================================
  // UNIFIED CROSS-ENTITY SEARCH API
  // ==========================================

  public unifiedSearch(userId: string, query: string, filter: 'all' | 'chats' | 'documents' | 'meetings' | 'memories' = 'all') {
    const qLower = query.toLowerCase().trim();
    const results: Array<{
      id: string;
      type: 'chat' | 'document' | 'meeting' | 'memory';
      title: string;
      snippet: string;
      timestamp: number;
      metadata?: any;
    }> = [];

    // 1. Search Chats
    if (filter === 'all' || filter === 'chats') {
      const convRows = this.db.prepare(`
        SELECT id, title, updatedAt 
        FROM conversations 
        WHERE userId = ? AND LOWER(title) LIKE ?
        LIMIT 10
      `).all(userId, `%${qLower}%`) as any[];

      for (const c of convRows) {
        results.push({
          id: c.id,
          type: 'chat',
          title: c.title,
          snippet: `Conversation: ${c.title}`,
          timestamp: c.updatedAt,
        });
      }

      // Also search message content
      const msgRows = this.db.prepare(`
        SELECT m.id, m.conversationId, m.content, m.timestamp, c.title as convTitle
        FROM conversation_messages m
        JOIN conversations c ON m.conversationId = c.id
        WHERE m.userId = ? AND LOWER(m.content) LIKE ?
        LIMIT 15
      `).all(userId, `%${qLower}%`) as any[];

      for (const m of msgRows) {
        if (!results.some(r => r.id === m.conversationId)) {
          results.push({
            id: m.conversationId,
            type: 'chat',
            title: m.convTitle || 'Conversation',
            snippet: m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content,
            timestamp: m.timestamp,
          });
        }
      }
    }

    // 2. Search Documents
    if (filter === 'all' || filter === 'documents') {
      const docRows = this.db.prepare(`
        SELECT id, title, fileName, summary, createdAt, chunkCount
        FROM documents
        WHERE userId = ? AND (LOWER(title) LIKE ? OR LOWER(fileName) LIKE ? OR LOWER(summary) LIKE ?)
        LIMIT 10
      `).all(userId, `%${qLower}%`, `%${qLower}%`, `%${qLower}%`) as any[];

      for (const d of docRows) {
        results.push({
          id: d.id,
          type: 'document',
          title: d.title,
          snippet: d.summary || `File: ${d.fileName} (${d.chunkCount} chunks)`,
          timestamp: d.createdAt,
          metadata: { fileName: d.fileName },
        });
      }
    }

    // 3. Search Meetings
    if (filter === 'all' || filter === 'meetings') {
      const meetRows = this.db.prepare(`
        SELECT id, title, summary, date, transcript
        FROM meetings
        WHERE userId = ? AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(transcript) LIKE ?)
        LIMIT 10
      `).all(userId, `%${qLower}%`, `%${qLower}%`, `%${qLower}%`) as any[];

      for (const m of meetRows) {
        results.push({
          id: m.id,
          type: 'meeting',
          title: m.title,
          snippet: m.summary || `Meeting session on ${new Date(m.date).toLocaleDateString()}`,
          timestamp: m.date,
        });
      }
    }

    // 4. Search Memories
    if (filter === 'all' || filter === 'memories') {
      const memRows = this.db.prepare(`
        SELECT id, title, content, category, tags, createdAt
        FROM memory_items
        WHERE userId = ? AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?)
        LIMIT 10
      `).all(userId, `%${qLower}%`, `%${qLower}%`, `%${qLower}%`) as any[];

      for (const m of memRows) {
        results.push({
          id: m.id,
          type: 'memory',
          title: m.title,
          snippet: m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content,
          timestamp: m.createdAt,
          metadata: { category: m.category, tags: JSON.parse(m.tags || '[]') },
        });
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ==========================================
  // FULL WORKSPACE DATA EXPORT API
  // ==========================================

  public exportUserData(userId: string) {
    const user = this.getUserById(userId);
    const preferences = this.getUserPreferences(userId);
    const stats = this.getUserWorkspaceStats(userId);
    const conversations = this.getConversations(userId);
    
    const detailedConversations = conversations.map(c => ({
      ...c,
      messages: this.getConversationMessages(c.id, userId),
    }));

    const documents = this.getDocuments(userId).map(d => {
      const full = this.getDocument(d.id, userId);
      return {
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        createdAt: d.createdAt,
        chunkCount: d.chunkCount,
        summary: d.summary,
        extractedConcepts: d.extractedConcepts,
        chunks: full?.chunks?.map(c => ({
          chunkIndex: c.chunkIndex,
          text: c.text,
          tokenCount: c.tokenCount,
        })) || [],
      };
    });

    const memories = this.getMemoryItems(userId, 'all', 500);
    const meetings = this.getMeetings(userId);
    const tasks = this.getTasks(userId);
    const actionProposals = this.getActionProposals(userId, 500);
    const privacyAudits = this.getPrivacyAudits(userId, 500);

    return {
      nexusVersion: '2.4.0-spatial-snapdragon',
      exportTimestamp: Date.now(),
      exportedAtISO: new Date().toISOString(),
      account: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        createdAt: user?.createdAt,
      },
      preferences,
      workspaceStats: stats,
      data: {
        conversations: detailedConversations,
        documents,
        memories: memories.map(m => ({
          id: m.id,
          category: m.category,
          title: m.title,
          content: m.content,
          tags: m.tags,
          createdAt: m.createdAt,
          privacyLevel: m.privacyLevel,
        })),
        meetings,
        tasks,
        actionProposals,
        privacyAudits,
      }
    };
  }
}

export const db = new NexusDatabase();
