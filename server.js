// Import paket
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// percobaan
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.admin.findMany();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'https://laporan-kappa.vercel.app'],  // Port Vite dan preview
  credentials: true
}));

// Serve static files untuk uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'pengaduan');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });  // Pastikan folder ada
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');  // Ganti spasi dengan underscore
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
  }
});

// Middleware autentikasi admin
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

app.get('/', (req, res) => {
  res.send('Server is running on port 5000');
});

// 1. Masyarakat
app.post('/api/masyarakat', async (req, res) => {
  const { nama, nik, no_hp, alamat } = req.body;
  if (!nama || !nik || !alamat) return res.status(400).json({ error: 'Nama, NIK, dan alamat diperlukan' });
  try {
    const masyarakat = await prisma.masyarakat.create({
      data: {
        nama,
        nik: Number(nik),  // Number untuk NIK 16 digit
        no_hp: no_hp ? parseInt(no_hp) : null,  // Parse ke Int, atau null jika tidak ada
        alamat
      }
    });
    res.json({
      message: 'Masyarakat added',
      masyarakat: { ...masyarakat, nik: masyarakat.nik.toString() }  // Konversi Number ke string
    });
  } catch (error) {
    console.error('Error inserting masyarakat:', error);
    res.status(500).json({ error: 'Gagal menambah masyarakat: ' + error.message });
  }
});

app.get('/api/masyarakat', async (req, res) => {  // Tambah endpoint get all masyarakat jika diperlukan
  try {
    const masyarakat = await prisma.masyarakat.findMany();
    const serializedMasyarakat = masyarakat.map(m => ({ ...m, nik: m.nik.toString() }));
    res.json(serializedMasyarakat);
  } catch (error) {
    console.error('Error fetching masyarakat:', error);
    res.status(500).json({ error: 'Gagal mengambil masyarakat: ' + error.message });
  }
});

app.get('/api/masyarakat/:id', async (req, res) => {
  try {
    const masyarakat = await prisma.masyarakat.findUnique({
      where: { id_masyarakat: parseInt(req.params.id) }
    });
    if (!masyarakat) return res.status(404).json({ error: 'Masyarakat not found' });
    res.json({ ...masyarakat, nik: masyarakat.nik.toString() });
  } catch (error) {
    console.error('Error fetching masyarakat:', error);
    res.status(500).json({ error: 'Gagal mengambil masyarakat: ' + error.message });
  }
});

// 2. Pengaduan

app.post('/api/pengaduan', upload.single('image'), async (req, res) => {
  const { name, phone, lokasi, idNumber, deskripsi } = req.body;

  if (!name || !deskripsi || !idNumber || !lokasi) {
    return res.status(400).json({ error: 'Nama, deskripsi, NIK, dan lokasi diperlukan' });
  }

  if (!/^\d{16}$/.test(idNumber)) {
    return res.status(400).json({ error: 'NIK harus berupa 16 digit angka' });
  }

  // Tambah validasi phone: hanya digit jika ada
  if (phone && !/^\d+$/.test(phone)) {
    return res.status(400).json({ error: 'Nomor HP harus berupa angka' });
  }

  try {
    let masyarakat = await prisma.masyarakat.findFirst({
      where: { nik: Number(idNumber) }
    });

    if (!masyarakat) {
      masyarakat = await prisma.masyarakat.create({
        data: {
          nama: name,
          nik: Number(idNumber),
          no_hp: phone ? String(phone) : null,  // parseInt dengan base 10, aman jika sudah divalidasi
          alamat: lokasi
        }
      });
    }

    const pengaduan = await prisma.pengaduan.create({
      data: {
        deskripsi,
        lokasi,
        status: 'pending',
        id_masyarakat: masyarakat.id_masyarakat
      }
    });

    let fotoUrl = null;
    if (req.file) {
      const foto = await prisma.foto.create({
        data: {
          id_pengaduan: pengaduan.id_pengaduan,
          file: req.file.filename,
          id_pengirim: masyarakat.id_masyarakat
        }
      });
      fotoUrl = `http://localhost:5000/uploads/pengaduan/${req.file.filename}`;
    }

    res.status(201).json({
      message: 'Pengaduan berhasil dikirim',
      pengaduan,
      masyarakat: { ...masyarakat, nik: masyarakat.nik.toString() },
      fotoUrl
    });
  } catch (error) {
    console.error('Error saat menyimpan pengaduan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
});

// Di app.get('/api/pengaduan', ...)
app.get('/api/pengaduan', async (req, res) => {
  try {
    const pengaduan = await prisma.pengaduan.findMany({
      include: { foto: true, masyarakat: true }
    });
    const serializedPengaduan = pengaduan.map(p => ({
      ...p,
      masyarakat: p.masyarakat ? { ...p.masyarakat, nik: p.masyarakat.nik.toString() } : null,  // Handle jika masyarakat null
      foto: (p.foto || []).map(f => ({  // Handle jika p.foto null, set []
        ...f,
        url: f.file.startsWith('data:') ? f.file : `http://localhost:5000/uploads/pengaduan/${f.file}`  // Handle base64 atau filename
      }))
    }));
    res.json(serializedPengaduan);
  } catch (error) {
    console.error('Error fetching pengaduan:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaduan: ' + error.message });
  }
});

// PUT untuk update status (hapus authenticateAdmin untuk sementara agar bisa update tanpa token)
app.put('/api/pengaduan/:id', async (req, res) => {  // Diubah: Hapus authenticateAdmin
  const { status, response } = req.body;  // Tambah response jika diperlukan
  if (!status) return res.status(400).json({ error: 'Status diperlukan' });
  try {
    const pengaduan = await prisma.pengaduan.update({
      where: { id_pengaduan: parseInt(req.params.id) },
      data: { status, response, updatedAt: new Date() }  // Update response dan updated_at
    });
    res.json({ message: 'Pengaduan updated', pengaduan });
  } catch (error) {
    console.error('Error updating pengaduan:', error);
    res.status(500).json({ error: 'Gagal update pengaduan: ' + error.message });
  }
});

// 3. Foto
app.post('/api/foto', upload.single('file'), async (req, res) => {
  const { pengaduanId } = req.body;
  if (!req.file || !pengaduanId) return res.status(400).json({ error: 'File dan ID pengaduan diperlukan' });
  try {
    const foto = await prisma.foto.create({
      data: {
        id_pengaduan: parseInt(pengaduanId),
        file: req.file.filename,  // Simpan filename
        id_pengirim: 1  // Dummy; sesuaikan dengan auth jika perlu (misal dari masyarakat yang login)
      }
    });
    res.json({
      message: 'Foto added',
      foto: { ...foto, url: `http://localhost:5000/uploads/pengaduan/${foto.file}` }
    });
  } catch (error) {
    console.error('Error inserting foto:', error);
    res.status(500).json({ error: 'Gagal menambah foto: ' + error.message });
  }
});

app.get('/api/foto/:pengaduanId', async (req, res) => {
  try {
    const foto = await prisma.foto.findMany({
      where: { id_pengaduan: parseInt(req.params.pengaduanId) }
    });
    const serializedFoto = foto.map(f => ({ ...f, url: `http://localhost:5000/uploads/pengaduan/${f.file}` }));
    res.json(serializedFoto);
  } catch (error) {
    console.error('Error fetching foto:', error);
    res.status(500).json({ error: 'Gagal mengambil foto: ' + error.message });
  }
});

// 4. Validasi
app.post('/api/validasi', authenticateAdmin, async (req, res) => {
  const { pengaduanId } = req.body;
  if (!pengaduanId) return res.status(400).json({ error: 'ID pengaduan diperlukan' });
  try {
    const validasi = await prisma.validasi.create({
      data: {
        id_pengaduan: parseInt(pengaduanId),
        Id_admin: req.admin.id
      }
    });
    res.json({ message: 'Validasi added', validasi });
  } catch (error) {
    console.error('Error inserting validasi:', error);
    res.status(500).json({ error: 'Gagal menambah validasi: ' + error.message });
  }
});

app.get('/api/validasi/:pengaduanId', authenticateAdmin, async (req, res) => {
  try {
    const validasi = await prisma.validasi.findMany({
      where: { id_pengaduan: parseInt(req.params.pengaduanId) }
    });
    res.json(validasi);
  } catch (error) {
    console.error('Error fetching validasi:', error);
    res.status(500).json({ error: 'Gagal mengambil validasi: ' + error.message });
  }
});

// 5. Admin
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password diperlukan' });
  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.Id_admin }, process.env.JWT_SECRET);
    res.json({ message: 'Login successful', token, admin });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Gagal login: ' + error.message });
  }
});

app.post('/api/admin', async (req, res) => {
  const { nama, password, email } = req.body;
  if (!nama || !password || !email) return res.status(400).json({ error: 'Semua field diperlukan' });
  try {
    const hashedPassword = await hashPassword(password);
    const admin = await prisma.admin.create({
      data: { nama, password: hashedPassword, email }
    });
    res.json({ message: 'Admin added', admin });
  } catch (error) {
    console.error('Error inserting admin:', error);
    res.status(500).json({ error: 'Gagal menambah admin: ' + error.message });
  }
});

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  prisma.$disconnect();
  process.exit(0);
});