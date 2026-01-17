const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(express.json());

// Perbaikan CORS: Untuk testing, izinkan semua origin (ubah ke 'http://localhost:5173' setelah fix)
app.use(cors({
  origin: '*',  // Ganti ke 'http://localhost:5173' jika frontend di port itu
  credentials: true
}));

// Setup multer untuk upload foto (simpan di folder uploads)
const upload = multer({ dest: 'uploads/' });

// Perbaikan: Inisialisasi koneksi MySQL sebagai promise-based agar await db.query() bisa digunakan
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();  // Tambahkan .promise() agar mendukung async/await

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
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

// Tambah route root untuk test (opsional)
app.get('/', (req, res) => {
    res.send('Server is running on port 5000');
});

// 1. Masyarakat
app.post('/api/masyarakat', (req, res) => {
    const { nama, nik, no_hp, alamat } = req.body;
    db.query('INSERT INTO masyarakat (nama, nik, no_hp, alamat) VALUES (?, ?, ?, ?)', [nama, nik, no_hp, alamat], (err, result) => {
        if (err) {
            console.error('Error inserting masyarakat:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Masyarakat added', id: result.insertId });
    });
});

app.get('/api/masyarakat/:id', (req, res) => {
    db.query('SELECT * FROM masyarakat WHERE id_masyarakat = ?', [req.params.id], (err, result) => {
        if (err) {
            console.error('Error fetching masyarakat:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result[0]);
    });
});

// 2. Pengaduan (Diperbaiki: Handle upload file dengan multer, simpan path di DB)
app.post('/api/pengaduan', upload.single('image'), async (req, res) => {  // Tambah upload.single('image')
    const { name, phone, lokasi, idNumber, deskripsi } = req.body;
    
    try {
        // Cek apakah masyarakat sudah ada berdasarkan NIK atau kombinasi nama dan no_hp
        const [masyarakat] = await db.query('SELECT id_masyarakat FROM masyarakat WHERE nik = ? OR (nama = ? AND no_hp = ?)', [idNumber, name, phone]);
        let id_masyarakat;
        
        if (masyarakat.length > 0) {
            // Jika sudah ada, gunakan id_masyarakat yang ada
            id_masyarakat = masyarakat[0].id_masyarakat;
        } else {
            // Jika belum ada, insert masyarakat baru
            const [result] = await db.query('INSERT INTO masyarakat (nama, nik, no_hp, alamat) VALUES (?, ?, ?, ?)', [name, idNumber, phone, lokasi]);
            id_masyarakat = result.insertId;
        }
        
        // Insert pengaduan dengan id_masyarakat (created_at otomatis dari DEFAULT)
        const [pengaduanResult] = await db.query('INSERT INTO pengaduan (id_masyarakat, deskripsi, lokasi, status) VALUES (?, ?, ?, ?)', [id_masyarakat, deskripsi, lokasi, 'pending']);
        const id_pengaduan = pengaduanResult.insertId;
        
        // Jika ada file, simpan path-nya
        if (req.file) {
            const imagePath = `/uploads/${req.file.filename}`;  // Path relatif
            await db.query('INSERT INTO foto (id_pengaduan, file, waktu, id_pengirim) VALUES (?, ?, NOW(), ?)', [id_pengaduan, imagePath, id_masyarakat]);
        }
        
        res.json({ message: 'Pengaduan berhasil dikirim', id_pengaduan });
    } catch (error) {
        console.error('Error saat menyimpan pengaduan:', error);
        res.status(500).json({ error: error.message });
    }
});

// Perbaikan: Endpoint GET dengan JOIN (fix syntax di mappedResult)
app.get('/api/pengaduan', async (req, res) => {  // Ubah ke async untuk konsistensi
    try {
        // JOIN untuk ambil data masyarakat dan foto
        const [result] = await db.query(`
            SELECT 
                p.id_pengaduan AS id, 
                m.nama AS name, 
                m.no_hp AS phone, 
                m.alamat AS address, 
                m.nik AS idNumber, 
                p.deskripsi AS description, 
                p.lokasi, 
                p.status, 
                p.created_at AS createdAt, 
                p.updated_at AS updatedAt, 
                f.file AS imageUrl
            FROM pengaduan p
            LEFT JOIN masyarakat m ON p.id_masyarakat = m.id_masyarakat
            LEFT JOIN foto f ON f.id_pengaduan = p.id_pengaduan
            ORDER BY p.created_at DESC
        `);
        
        // Map result agar match interface Complaint (fix: ganti || , jadi || null)
        const mappedResult = result.map(row => ({
            ...row,
            status: row.status,
            createdAt: new Date(row.createdAt),
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
            imageUrl: row.imageUrl || null,  // Perbaikan: Fix syntax error
        }));
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching pengaduan:', error);
        res.status(500).json({ error: error.message });
    }
});

// Perbaikan: Tambahkan updated_at = NOW() saat update status
app.put('/api/pengaduan/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE pengaduan SET status = ?, updated_at = NOW() WHERE id_pengaduan = ?', [status, req.params.id], (err) => {
        if (err) {
            console.error('Error updating pengaduan:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Pengaduan updated' });
    });
});

// 3. Foto (dengan upload file) - Tetap ada untuk kompatibilitas, tapi gambar dari frontend disimpan sebagai path
app.post('/api/foto', upload.single('file'), (req, res) => {
    const { id_pengaduan, id_pengirim } = req.body;
    const file = req.file ? req.file.filename : null;
    if (!file) return res.status(400).json({ error: 'File required' });
    db.query('INSERT INTO foto (id_pengaduan, file, id_pengirim) VALUES (?, ?, ?)', [id_pengaduan, file, id_pengirim], (err, result) => {
        if (err) {
            console.error('Error inserting foto:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Foto added', id: result.insertId });
    });
});

app.get('/api/foto/:id_pengaduan', (req, res) => {
    db.query('SELECT * FROM foto WHERE id_pengaduan = ?', [req.params.id_pengaduan], (err, result) => {
        if (err) {
            console.error('Error fetching foto:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

// 4. Validasi (hanya admin yang bisa)
app.post('/api/validasi', authenticateAdmin, (req, res) => {
    const { id_pengaduan, status_validasi, catatan } = req.body;
    const id_admin = req.admin.id_admin;
    db.query('INSERT INTO validasi (id_pengaduan, id_admin, status_validasi, catatan) VALUES (?, ?, ?, ?)', [id_pengaduan, id_admin, status_validasi, catatan], (err, result) => {
        if (err) {
            console.error('Error inserting validasi:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Validasi added', id: result.insertId });
    });
});

app.get('/api/validasi/:id_pengaduan', authenticateAdmin, (req, res) => {
    db.query('SELECT * FROM validasi WHERE id_pengaduan = ?', [req.params.id_pengaduan], (err, result) => {
        if (err) {
            console.error('Error fetching validasi:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

// 5. Admin (Login dan Register)
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [result] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        if (result.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, result[0].password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id_admin: result[0].id_admin }, process.env.JWT_SECRET);
        res.json({ message: 'Login successful', token, admin: result[0] });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin', async (req, res) => {
    const { nama, password, email } = req.body;
    try {
        const hashedPassword = await hashPassword(password);
        const [result] = await db.query('INSERT INTO admin (nama, password, email) VALUES (?, ?, ?)', [nama, hashedPassword, email]);
        res.json({ message: 'Admin added', id: result.insertId });
    } catch (error) {
        console.error('Error inserting admin:', error);
        res.status(500).json({ error: error.message });
    }
});

// Tambah static serve untuk folder uploads (agar gambar bisa diakses dari frontend)
app.use('/uploads', express.static('uploads'));

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});