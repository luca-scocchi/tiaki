/**
 * TIAKI Logistics — Server locale
 * Serve i file statici + invia email via SMTP al POST /send
 *
 * Avvio: node server.js
 */

'use strict';

const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const nodemailer = require('nodemailer');

/* ══════════════════════════════════════════════════════════
   CONFIGURAZIONE SMTP — modifica questi valori
   ══════════════════════════════════════════════════════════ */
const SMTP = {
  host:    'smtp.gmail.com',
  port:    587,
  secure:  false,
  user:    'tiakilogistics@gmail.com',
  pass:    'mxisawechipiwsei',
  to:      'support@tiakilogistics.com',
};

const PORT = 3000;

/* ══════════════════════════════════════════════════════════
   TRASPORTATORE NODEMAILER
   ══════════════════════════════════════════════════════════ */
const transporter = nodemailer.createTransport({
  host:   SMTP.host,
  port:   SMTP.port,
  secure: SMTP.secure,
  auth: {
    user: SMTP.user,
    pass: SMTP.pass,
  },
});

/* ══════════════════════════════════════════════════════════
   MIME TYPES per file statici
   ══════════════════════════════════════════════════════════ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

/* ══════════════════════════════════════════════════════════
   LEGGE BODY POST
   ══════════════════════════════════════════════════════════ */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/json')) {
          resolve(JSON.parse(body));
        } else {
          // application/x-www-form-urlencoded
          resolve(Object.fromEntries(new URLSearchParams(body)));
        }
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/* ══════════════════════════════════════════════════════════
   SERVER HTTP
   ══════════════════════════════════════════════════════════ */
const server = http.createServer(async (req, res) => {

  /* ── CORS headers (utile in sviluppo) ── */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* ── POST /send — invio email ── */
  if (req.method === 'POST' && req.url === '/send') {
    try {
      const data = await readBody(req);

      const mailOptions = {
        from:    `"TIAKI Logistics Form" <${SMTP.user}>`,
        to:      SMTP.to,
        replyTo: data.email || SMTP.user,
        subject: `Nuova richiesta demo — ${data.name || 'Utente sconosciuto'}`,
        html: `
          <h2>Nuova richiesta dal sito TIAKI Logistics</h2>
          <table cellpadding="8" style="border-collapse:collapse; font-family:sans-serif;">
            <tr><td><strong>Nome</strong></td><td>${data.name || '—'}</td></tr>
            <tr><td><strong>Azienda</strong></td><td>${data.company || '—'}</td></tr>
            <tr><td><strong>Email</strong></td><td>${data.email || '—'}</td></tr>
            <tr><td><strong>Ruolo</strong></td><td>${data.role || '—'}</td></tr>
            <tr><td><strong>Messaggio</strong></td><td>${(data.message || '—').replace(/\n/g, '<br>')}</td></tr>
          </table>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));

    } catch (err) {
      console.error('Errore invio email:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  /* ── File statici ── */
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Sicurezza: blocca path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end();
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅  Server avviato → http://localhost:${PORT}`);
  console.log(`📧  Email in uscita da: ${SMTP.user}`);
  console.log(`📬  Email in arrivo a:  ${SMTP.to}\n`);
});
