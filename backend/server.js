
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from 'dotenv';
import { pool } from "./db.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// ==============================
// DB Bootstrap (Auto-init)
// ==============================
async function initDb() {
  try {
    // 1. Customers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. Tickets Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        customer_id TEXT REFERENCES customers(id),
        customer_name TEXT,
        category TEXT,
        priority TEXT,
        status TEXT DEFAULT 'NEW',
        location_url TEXT,
        house_number TEXT,
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. Customer ID Sequence
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_id_seq (
      id BIGSERIAL PRIMARY KEY
    );
  `);
    
    // 4. Users/Technicians Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
// 5. Teams Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lead_id TEXT,
        member_ids JSONB DEFAULT '[]',
        status TEXT DEFAULT 'AVAILABLE',
        current_site_id TEXT,
        workload_level TEXT DEFAULT 'LOW'
      );
    `);

    // 6. Sites Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        client_name TEXT,
        location TEXT,
        priority TEXT,
        status TEXT DEFAULT 'PLANNED',
        assigned_team_id TEXT
      );
    `);

    // 7. Activities Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        reference TEXT,
        type TEXT,
        priority TEXT,
        status TEXT DEFAULT 'PLANNED',
        planned_date TIMESTAMPTZ,
        customer_id TEXT,
        site_id TEXT,
        lead_tech_id TEXT,
        description TEXT,
        duration_hours NUMERIC,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    
// Create a default admin if none exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@qonnect.qa'");
    if (adminCheck.rows.length === 0) {
        const hashedPass = await bcrypt.hash("admin123", 10);
        await pool.query(
            "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
            ["u-admin", "System Admin", "admin@qonnect.qa", hashedPass, "ADMIN"]
        );
        console.log("✅ Default Admin User Created");
    } else {
        // This line automatically fixes the broken user currently stuck in your live database!
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE role = 'OPERATIONS_MANAGER'");
    }
    
    console.log("✅ DB initialized with Tickets and Customers");
  } catch (err) {
    console.error("❌ DB initialization failed:", err);
  }
}

// Middleware
app.use(express.json({ limit: '10mb' })); 
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Check API Key
if (!process.env.API_KEY) {
  console.error("❌ FATAL ERROR: API_KEY is missing in backend/.env file.");
  console.error("AI features will not work.");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==============================
// Tickets (PostgreSQL)
// ==============================

// 1. Get all tickets from DB
app.get("/api/tickets", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets ORDER BY updated_at DESC");
    res.json(result.rows);
  } catch (e) {
    console.error("Tickets fetch error:", e);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// 2. Create a new ticket in DB
app.post("/api/tickets", async (req, res) => {
  try {
    const { id, customerId, customerName, category, priority, locationUrl, houseNumber, messages } = req.body;
    const result = await pool.query(
      "INSERT INTO tickets (id, customer_id, customer_name, category, priority, location_url, house_number, messages) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [id, customerId, customerName, category, priority, locationUrl, houseNumber, JSON.stringify(messages)]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("Ticket creation error:", e);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// 3. Delete a ticket in DB (Admin only)
app.delete("/api/tickets/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query("DELETE FROM tickets WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("Ticket deletion error:", e);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

// ==============================
// Customers (PostgreSQL)
// ==============================
function toCustomerId(n) {
  return `QNC-CUST-${String(n).padStart(4, "0")}`;
}

async function nextCustomerId() {
  const { rows } = await pool.query(
    "INSERT INTO customer_id_seq DEFAULT VALUES RETURNING id"
  );
  return toCustomerId(Number(rows[0].id));
}

// List customers (optional search: ?q=)
app.get("/api/customers", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    let result;

    if (q) {
      result = await pool.query(
        `
        SELECT * FROM customers
        WHERE id ILIKE $1 OR name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
        ORDER BY created_at DESC
        LIMIT 200
        `,
        [`%${q}%`]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM customers ORDER BY created_at DESC LIMIT 200`
      );
    }

    res.json(result.rows);
  } catch (e) {
    console.error("customers list error:", e);
    res.status(500).json({ error: "Failed to list customers" });
  }
});

// Create customer
app.post("/api/customers", async (req, res) => {
  try {
    const { name, phone, email, address, notes, is_active } = req.body || {};

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const id = await nextCustomerId();

    const { rows } = await pool.query(
      `
      INSERT INTO customers (id, name, phone, email, address, notes, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        id,
        String(name).trim(),
        phone ? String(phone).trim() : null,
        email ? String(email).trim() : null,
        address ? String(address).trim() : null,
        notes ? String(notes).trim() : null,
        typeof is_active === "boolean" ? is_active : true,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("customers create error:", e);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Update customer
app.put("/api/customers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, phone, email, address, notes, is_active } = req.body || {};

    const { rows } = await pool.query(
      `
      UPDATE customers
      SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        address = COALESCE($5, address),
        notes = COALESCE($6, notes),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        name !== undefined ? String(name).trim() : null,
        phone !== undefined ? (phone ? String(phone).trim() : null) : null,
        email !== undefined ? (email ? String(email).trim() : null) : null,
        address !== undefined ? (address ? String(address).trim() : null) : null,
        notes !== undefined ? (notes ? String(notes).trim() : null) : null,
        typeof is_active === "boolean" ? is_active : null,
      ]
    );

    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("customers update error:", e);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete customer
app.delete("/api/customers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const r = await pool.query(`DELETE FROM customers WHERE id=$1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("customers delete error:", e);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Analyze Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not configured on server");
    }

    const { message, history = [] } = req.body;
    console.log(`[Analyze] Processing message: "${message?.substring(0, 50)}..."`);
    
    const context = history.length > 0 ? `Conversation History:\n${history.join('\n')}\n\n` : '';
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `You are a field operations & after-sales support assistant in Qatar.\n` +
                `${context}` +
                `Analyze the client message and return STRICT JSON only.\n\n` +
                `Client message:\n"""${message}"""\n\n` +
                `Decide:\n` +
                `- Provide a short summary\n` +
                `- Choose service_category (ELV Systems / Home Automation / Unknown)\n` +
                `- Choose priority (LOW/MEDIUM/HIGH/URGENT)\n` +
                `- Decide if remote_possible\n` +
                `- Choose recommended_action (remote_support / assign_technician / request_more_info)\n` +
                `- Provide up to 3 suggested_questions\n` +
                `- Provide a professional draft_reply\n` +
                `- Provide confidence 0-100\n`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            service_category: {
              type: SchemaType.STRING,
              enum: ["ELV Systems", "Home Automation", "Unknown"]
            },
            priority: {
              type: SchemaType.STRING,
              enum: ["LOW", "MEDIUM", "HIGH", "URGENT"]
            },
            remote_possible: { type: SchemaType.BOOLEAN },
            recommended_action: {
              type: SchemaType.STRING,
              enum: ["remote_support", "assign_technician", "request_more_info"]
            },
            suggested_questions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            draft_reply: { type: SchemaType.STRING },
            confidence: { type: SchemaType.NUMBER }
          },
          required: [
            "summary",
            "service_category",
            "priority",
            "remote_possible",
            "recommended_action",
            "suggested_questions",
            "draft_reply",
            "confidence"
          ]
        }
      }
    });

    // CORRECTED DATA EXTRACTION
    const rawText = result.response.text();
    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        console.warn("[Analyze] JSON parse failed, attempting cleanup.");
        const start = rawText.indexOf("{");
        const end = rawText.lastIndexOf("}");
        if (start >= 0 && end > start) {
            data = JSON.parse(rawText.slice(start, end + 1));
        } else {
            throw new Error("Invalid JSON response from AI");
        }
    }

    res.json(data);
  } catch (error) {
    console.error("[Analyze] Error:", error);
    res.status(500).json({ 
        error: "Failed to process analysis", 
        details: error.message 
    });
  }
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.API_KEY) throw new Error("API_KEY not configured");

    const { history, newMessage } = req.body;
    
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

   // CORRECTED SYSTEM INSTRUCTION PLACEMENT
   const model = genAI.getGenerativeModel({ 
       model: "gemini-1.5-flash",
       systemInstruction: "You are Qonnect AI, a helpful field operations assistant."
   });
   
   const result = await model.generateContent({
      contents: contents
    });

    // CORRECTED DATA EXTRACTION
    res.json({ text: result.response.text() });
  } catch (error) {
    console.error("[Chat] Error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// ==============================
// Authentication & Users (JWT)
// ==============================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    
    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email }, 
        process.env.JWT_SECRET || 'fallback_secret', 
        { expiresIn: '12h' }
    );

    res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email, role as \"systemRole\", status FROM users");
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ==============================
// Operations & Planning (Teams, Sites, Activities)
// ==============================

// GET Teams
app.get("/api/teams", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM teams");
    res.json(rows.map(r => ({
        id: r.id, name: r.name, leadId: r.lead_id, memberIds: r.member_ids,
        status: r.status, currentSiteId: r.current_site_id, workloadLevel: r.workload_level
    })));
  } catch (e) { res.status(500).json({error: "Failed to load teams"}); }
});

// GET Sites
app.get("/api/sites", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sites");
    res.json(rows.map(r => ({
        id: r.id, name: r.name, clientName: r.client_name, location: r.location,
        priority: r.priority, status: r.status, assignedTeamId: r.assigned_team_id
    })));
  } catch (e) { res.status(500).json({error: "Failed to load sites"}); }
});

// GET Activities
app.get("/api/activities", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM activities ORDER BY created_at DESC");
    res.json(rows.map(r => ({
        id: r.id, reference: r.reference, type: r.type, priority: r.priority,
        status: r.status, plannedDate: r.planned_date, customerId: r.customer_id,
        siteId: r.site_id, leadTechId: r.lead_tech_id, description: r.description,
        durationHours: Number(r.duration_hours), ...r.details,
        createdAt: r.created_at, updatedAt: r.updated_at
    })));
  } catch (e) { res.status(500).json({error: "Failed to load activities"}); }
});

// POST Activity (Create)
app.post("/api/activities", async (req, res) => {
    try {
        const { id, reference, type, priority, status, plannedDate, customerId, siteId, leadTechId, description, durationHours, ...details } = req.body;
        await pool.query(
            `INSERT INTO activities (id, reference, type, priority, status, planned_date, customer_id, site_id, lead_tech_id, description, duration_hours, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [id, reference, type, priority, status, plannedDate, customerId, siteId, leadTechId, description, durationHours, JSON.stringify(details)]
        );
        res.status(201).json({ok: true});
    } catch(e) { console.error(e); res.status(500).json({error: "Failed to create activity"}); }
});

// PUT Activity (Update)
app.put("/api/activities/:id", async (req, res) => {
    try {
        const { type, priority, status, plannedDate, customerId, siteId, leadTechId, description, durationHours, ...details } = req.body;
        await pool.query(
            `UPDATE activities SET type=$1, priority=$2, status=$3, planned_date=$4, customer_id=$5, site_id=$6, lead_tech_id=$7, description=$8, duration_hours=$9, details=$10, updated_at=NOW() WHERE id=$11`,
            [type, priority, status, plannedDate, customerId, siteId, leadTechId, description, durationHours, JSON.stringify(details), req.params.id]
        );
        res.json({ok: true});
    } catch(e) { console.error(e); res.status(500).json({error: "Failed to update activity"}); }
});

// DELETE Activity
app.delete("/api/activities/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM activities WHERE id=$1", [req.params.id]);
        res.json({ok: true});
    } catch(e) { res.status(500).json({error: "Failed to delete activity"}); }
});

// ==============================
// WhatsApp Webhook Integration
// ==============================
app.get("/api/whatsapp/webhook", (req, res) => {
    // Meta/WhatsApp Verification
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // The verify token here must match the one you set in Meta Developer Dashboard
    if (mode === "subscribe" && token === "QONNECT_WA_TOKEN") {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
        const body = req.body;
        // Verify this is from WhatsApp API
        if (body.object === "whatsapp_business_account") {
            for (let entry of body.entry) {
                for (let change of entry.changes) {
                    if (change.value && change.value.messages) {
                        const msg = change.value.messages[0];
                        const contact = change.value.contacts?.[0];
                        
                        const phone = msg.from; // Sender's phone number
                        const name = contact?.profile?.name || "Unknown WhatsApp User";
                        const text = msg.text?.body || "Media message received";

                        console.log(`[WhatsApp] New message from ${name} (${phone}): ${text}`);

                        // 1. FIND OR CREATE CUSTOMER (Only 1 per phone number forever)
                        let customerRes = await pool.query("SELECT * FROM customers WHERE phone_number = $1", [phone]);
                        let customerId;
                        
                        if (customerRes.rows.length === 0) {
                            customerId = `c-${Date.now()}`;
                            await pool.query(
                                "INSERT INTO customers (id, name, phone_number, created_at) VALUES ($1, $2, $3, NOW())",
                                [customerId, name, phone]
                            );
                            console.log(`✅ New Customer Created: ${name}`);
                        } else {
                            customerId = customerRes.rows[0].id;
                        }

                        // 2. FIND ACTIVE OR RECENT TICKET (Within 7 days)
                        let ticketRes = await pool.query(`
                            SELECT * FROM tickets 
                            WHERE customer_id = $1 
                            AND (status NOT IN ('RESOLVED', 'CLOSED') OR updated_at > NOW() - INTERVAL '7 days')
                            ORDER BY updated_at DESC LIMIT 1
                        `, [customerId]);

                        const newMessageObj = {
                            id: `wa-${Date.now()}`,
                            sender: 'CLIENT',
                            content: text,
                            timestamp: new Date().toISOString()
                        };

                        if (ticketRes.rows.length > 0) {
                            // APPEND TO EXISTING TICKET
                            const existingTicket = ticketRes.rows[0];
                            const updatedMessages = [...(existingTicket.messages || []), newMessageObj];
                            
                            await pool.query(
                                "UPDATE tickets SET messages = $1, updated_at = NOW() WHERE id = $2",
                                [JSON.stringify(updatedMessages), existingTicket.id]
                            );
                            console.log(`✅ Message appended to existing ticket: ${existingTicket.id}`);
                        } else {
                            // CREATE NEW TICKET
                            const ticketId = `t-${Date.now()}`;
                            await pool.query(
                                `INSERT INTO tickets (id, customer_id, title, status, priority, source, messages, created_at, updated_at) 
                                 VALUES ($1, $2, $3, 'NEW', 'MEDIUM', 'WHATSAPP', $4, NOW(), NOW())`,
                                [ticketId, customerId, `WhatsApp Inquiry from ${name}`, JSON.stringify([newMessageObj])]
                            );
                            console.log(`✅ New ticket created: ${ticketId}`);
                        }
                    }
                }
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("[WhatsApp Webhook Error]:", error);
        res.sendStatus(500);
    }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
  });
});
