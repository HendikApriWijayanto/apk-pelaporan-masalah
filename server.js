const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());  // Izinkan request dari frontend React

// Setup multer untuk upload foto (simpan di folder uploads)
const upload = multer({ dest: 'uploads/' });

// Koneksi ke MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database: laporan_kelurahan');
});

// Middleware autentikasi admin (gunakan JWT)
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Hash password
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

// API Endpoints

// 1. Masyarakat
app.post('/api/masyarakat', (req, res) => {
    const { nama, nik, no_hp, alamat } = req.body;
    db.query('INSERT INTO masyarakat (nama, nik, no_hp, alamat) VALUES (?, ?, ?, ?)', [nama, nik, no_hp, alamat], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Masyarakat added', id: result.insertId });
    });
});

app.get('/api/masyarakat/:id', (req, res) => {
    db.query('SELECT * FROM masyarakat WHERE id_masyarakat = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
});

// 2. Pengaduan (Diperbaiki untuk menangani data masyarakat dan gambar)
app.post('/api/pengaduan', async (req, res) => {
    const { name, phone, lokasi, idNumber, deskripsi, imageUrl } = req.body;
    
    try {
        // Cek apakah masyarakat sudah ada berdasarkan NIK atau kombinasi nama dan no_hp
        let [masyarakat] = await db.promise().query('SELECT id_masyarakat FROM masyarakat WHERE nik = ? OR (nama = ? AND no_hp = ?)', [idNumber, name, phone]);
        let id_masyarakat;
        
        if (masyarakat.length > 0) {
            // Jika sudah ada, gunakan id_masyarakat yang ada
            id_masyarakat = masyarakat[0].id_masyarakat;
        } else {
            // Jika belum ada, insert masyarakat baru
            const [result] = await db.promise().query('INSERT INTO masyarakat (nama, nik, no_hp, alamat) VALUES (?, ?, ?, ?)', [name, idNumber, phone, lokasi]);
            id_masyarakat = result.insertId;
        }
        
        // Insert pengaduan dengan id_masyarakat
        const [pengaduanResult] = await db.promise().query('INSERT INTO pengaduan (id_masyarakat, deskripsi, lokasi, status) VALUES (?, ?, ?, ?)', [id_masyarakat, deskripsi, lokasi, 'pending']);
        const id_pengaduan = pengaduanResult.insertId;
        
        // Jika ada gambar (imageUrl), insert ke tabel foto sebagai string base64
        if (imageUrl) {
            await db.promise().query('INSERT INTO foto (id_pengaduan, file, waktu, id_pengirim) VALUES (?, ?, NOW(), ?)', [id_pengaduan, imageUrl, id_masyarakat]);
        }
        
        res.json({ message: 'Pengaduan berhasil dikirim', id_pengaduan });
    } catch (error) {
        console.error('Error saat menyimpan pengaduan:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pengaduan', (req, res) => {
    db.query('SELECT * FROM pengaduan', (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.put('/api/pengaduan/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE pengaduan SET status = ? WHERE id_pengaduan = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Pengaduan updated' });
    });
});

// 3. Foto (dengan upload file) - Tetap ada untuk kompatibilitas, tapi gambar dari frontend disimpan sebagai string
app.post('/api/foto', upload.single('file'), (req, res) => {
    const { id_pengaduan, id_pengirim } = req.body;
    const file = req.file ? req.file.filename : null;
    if (!file) return res.status(400).json({ error: 'File required' });
    db.query('INSERT INTO foto (id_pengaduan, file, id_pengirim) VALUES (?, ?, ?)', [id_pengaduan, file, id_pengirim], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Foto added', id: result.insertId });
    });
});

app.get('/api/foto/:id_pengaduan', (req, res) => {
    db.query('SELECT * FROM foto WHERE id_pengaduan = ?', [req.params.id_pengaduan], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// 4. Validasi (hanya admin yang bisa)
app.post('/api/validasi', authenticateAdmin, (req, res) => {
    const { id_pengaduan, status_validasi, catatan } = req.body;
    const id_admin = req.admin.id_admin;
    db.query('INSERT INTO validasi (id_pengaduan, id_admin, status_validasi, catatan) VALUES (?, ?, ?, ?)', [id_pengaduan, id_admin, status_validasi, catatan], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Validasi added', id: result.insertId });
    });
});

app.get('/api/validasi/:id_pengaduan', authenticateAdmin, (req, res) => {
    db.query('SELECT * FROM validasi WHERE id_pengaduan = ?', [req.params.id_pengaduan], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// 5. Admin (Login dan Register)
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM admin WHERE email = ?', [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, result[0].password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id_admin: result[0].id_admin }, process.env.JWT_SECRET);
        res.json({ message: 'Login successful', token, admin: result[0] });
    });
});

app.post('/api/admin', async (req, res) => {
    const { nama, password, email } = req.body;
    const hashedPassword = await hashPassword(password);
    db.query('INSERT INTO admin (nama, password, email) VALUES (?, ?, ?)', [nama, hashedPassword, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Admin added', id: result.insertId });
    });
});

// Jalankan server
const PORT = process.env.PORT || 5000;  // Menggunakan 5000 dari .env
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});