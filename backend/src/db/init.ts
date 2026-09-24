import { pool } from './index';

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing PostgreSQL database tables for SITA Webchat...');

    await client.query(`
      -- 1. Chat Sessions
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_name VARCHAR(150) NOT NULL,
        visitor_email VARCHAR(150) NOT NULL,
        visitor_phone VARCHAR(50) NOT NULL,
        status VARCHAR(30) DEFAULT 'BOT_ACTIVE',
        assigned_agent_id UUID NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 2. Chat Messages & Token Tracker
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'agent', 'system'
        sender_name VARCHAR(150),
        content TEXT NOT NULL,
        prompt_tokens INT DEFAULT 0,
        completion_tokens INT DEFAULT 0,
        total_tokens INT DEFAULT 0,
        latency_ms INT DEFAULT 0,
        model_name VARCHAR(100),
        retrieved_sources JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 3. Knowledge Base
      CREATE TABLE IF NOT EXISTS knowledge_bases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL, -- 'destinasi', 'acara', 'akomodasi', 'layanan', 'umum'
        source_url VARCHAR(500),
        raw_content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 4. Knowledge Chunks with Vector Embeddings
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        knowledge_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
        chunk_index INT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding JSONB NOT NULL, -- Array of floats [0.012, -0.045, ...]
        token_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 5. Tickets
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'OPEN',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        assigned_to VARCHAR(150) NULL,
        location_details VARCHAR(255) NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 6. Ticket Comments / Activity Log
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        sender_name VARCHAR(150) NOT NULL,
        sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent', 'system'
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 7. Agents & Staff Users
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        role VARCHAR(30) DEFAULT 'AGENT', -- 'ADMIN', 'AGENT'
        is_online BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for fast query lookups
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
      CREATE INDEX IF NOT EXISTS idx_tickets_phone ON tickets(phone);
      CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
      CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_knowledge ON knowledge_chunks(knowledge_id);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
    `);

    // Insert initial default agents if none exists
    const usersCount = await client.query(`SELECT COUNT(*) FROM users;`);
    if (parseInt(usersCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (name, email, role, is_online)
        VALUES 
          ('I Wayan Sastrawan (Petugas Pelayanan)', 'petugas@badungkab.go.id', 'AGENT', true),
          ('Ni Made Candrawati (Admin Helpdesk)', 'admin@badungkab.go.id', 'ADMIN', true);
      `);
      console.log('✅ Default staff agents seeded.');
    }

    console.log('✅ PostgreSQL database tables initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct execution from CLI
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
