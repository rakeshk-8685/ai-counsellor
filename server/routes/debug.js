const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

// GET /api/debug/tables - List all tables
router.get('/tables', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        res.json({ tables: result.rows.map(r => r.table_name) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/debug/fix-schema - Force Apply Schema
router.get('/fix-schema', async (req, res) => {
    try {
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schemaSql);
        res.json({ message: "✅ Schema applied successfully!", status: "OK" });
    } catch (err) {
        console.error("Schema apply failed:", err);
        res.status(500).json({ error: "Failed to apply schema", details: err.message });
    }
});

// GET /api/debug/connection - Test Database Connection
router.get('/connection', async (req, res) => {
    try {
        const start = Date.now();
        const result = await db.query('SELECT NOW()');
        const duration = Date.now() - start;
        res.json({
            status: "Connected",
            timestamp: result.rows[0].now,
            duration: `${duration}ms`,
            database_url_configured: !!process.env.DATABASE_URL,
            node_env: process.env.NODE_ENV
        });
    } catch (err) {
        res.status(500).json({
            status: "Error",
            error: err.message,
            details: err.code
        });
    }
});

// GET /api/debug/schema - Inspect Users Table Columns
router.get('/schema', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        res.json({
            table: 'users',
            columns: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/debug/connection - Test Database Connection
router.get('/connection', async (req, res) => {
    try {
        const start = Date.now();
        const result = await db.query('SELECT NOW()');
        const duration = Date.now() - start;
        res.json({
            status: "Connected",
            timestamp: result.rows[0].now,
            duration: `${duration}ms`,
            database_url_configured: !!process.env.DATABASE_URL,
            node_env: process.env.NODE_ENV
        });
    } catch (err) {
        res.status(500).json({
            status: "Error",
            error: err.message,
            details: err.code
        });
    }
});

// GET /api/debug/schema - Inspect Users Table Columns
router.get('/schema', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        res.json({
            table: 'users',
            columns: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
