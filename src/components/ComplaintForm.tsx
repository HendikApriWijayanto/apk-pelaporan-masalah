import { useState, useRef } from 'react';
import { Camera, Upload, X, ArrowLeft, Send } from 'lucide-react';
import { Complaint } from '../App';

interface ComplaintFormProps {
  onSubmit: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function ComplaintForm({ onSubmit, onCancel }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    idNumber: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);  // Ubah: Simpan file asli, bukan base64 string
  const [imagePreview, setImagePreview] = useState<string>('');  // Untuk preview saja
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);  // Simpan file asli untuk kirim ke server
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);  // Preview base64 untuk UI
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address || !formData.description) {
      alert('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    try {
      // Gunakan FormData untuk kirim file asli (bukan JSON)
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('lokasi', formData.address);  // Match kolom DB
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('deskripsi', formData.description);
      if (imageFile) {
        formDataToSend.append('image', imageFile);  // Kirim file asli
      }

      const response = await fetch('http://localhost:5000/api/pengaduan', {
        method: 'POST',
        body: formDataToSend,  // Kirim FormData, bukan JSON
      });

      if (response.ok) {
        const result = await response.json();
        alert('Laporan berhasil dikirim!');
        
        // Update UI dengan preview (base64 untuk tampilan sementara)
        onSubmit({
          ...formData,
          imageUrl: imagePreview || undefined,  // Perbaiki: Tambahkan 'undefined' setelah ||
        });
      } else {
        const errorData = await response.json();
        alert('Gagal menyimpan: ' + (errorData.error || 'Terjadi kesalahan server'));
      }
    } catch (error) {
      console.error('Error saat kirim data:', error);
      alert('Koneksi ke server gagal. Pastikan server.js sudah jalan di port 5000');
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
                  Nomor HP *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08xxxxxxxxxx"
                  required
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
                  placeholder="Masukkan alamat lengkap"
                  required
                />
              </div>

              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  NIK (Nomor Induk Kependudukan)
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="16 digit NIK"
                  maxLength={16}
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
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span>Kirim Laporan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}