import { useState, useRef } from 'react';
import { Camera, Upload, X, ArrowLeft, Send } from 'lucide-react';
import { Complaint } from '../App'; // Asumsikan interface Complaint dari App.tsx

interface ComplaintFormProps {
  onSubmit: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function ComplaintForm({ onSubmit, onCancel }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '', // Match interface Complaint
    idNumber: '', // Match interface Complaint
    description: '', // Match interface Complaint
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreview(reader.result as string);
        } else {
          alert('Gagal membaca file gambar. Coba lagi.');
          setImageFile(null);
        }
      };
      reader.onerror = () => {
        alert('Error membaca file. Pastikan file gambar valid.');
        setImageFile(null);
        setImagePreview('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Match server: name, deskripsi, idNumber, lokasi wajib; phone opsional
    if (!formData.name || !formData.address || !formData.idNumber || !formData.description) {
      alert('Mohon lengkapi semua data yang diperlukan (Nama, Lokasi, NIK, Deskripsi)');
      return;
    }

    // Validasi NIK: 16 digit angka (match server)
    if (!/^\d{16}$/.test(formData.idNumber)) {
      alert('NIK harus berupa 16 digit angka');
      return;
    }

    // Validasi phone: jika ada, allow spasi/hyphen di client, tapi hapus saat kirim untuk match server /^\d+$/
    if (formData.phone && !/^[0-9\s\-]+$/.test(formData.phone)) {
      alert('Nomor HP harus berupa angka, spasi, atau tanda hubung');
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.phone) { // Hanya append jika ada phone, agar server set null jika kosong
        formDataToSend.append('phone', formData.phone.replace(/[\s\-]/g, ''));
      }
      formDataToSend.append('lokasi', formData.address); // Match server (lokasi dari address)
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('deskripsi', formData.description); // Match server (deskripsi dari description)
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch('http://localhost:5000/api/pengaduan', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert('Laporan berhasil dikirim!');
        
        // Match interface Complaint: { name, phone, address, idNumber, description, imageUrl? }
        onSubmit({
  name: formData.name,
  phone: formData.phone, // String kosong jika tidak ada
  address: formData.address,
  idNumber: formData.idNumber,
  description: formData.description,
  imageUrl: result.fotoUrl || undefined,  // Perbaiki: hapus koma, tambah undefined
});
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert('Gagal menyimpan: ' + (errorData.error || 'Terjadi kesalahan server'));
      }
    } catch (error) {
      console.error('Error saat kirim data:', error);
      alert('Koneksi ke server gagal. Pastikan server.js sudah jalan di port 5000');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Buat Pengaduan Baru</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Diri</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan lokasi pengaduan"
                  required
                />
              </div>

              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  NIK *
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan NIK (16 digit)"
                  pattern="[0-9]{16}"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gambar Laporan</h2>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-600">Pilih gambar dari galeri</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Ambil foto dengan kamera</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deskripsi Masalah</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Jelaskan masalah yang ingin Anda laporkan dengan detail..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}