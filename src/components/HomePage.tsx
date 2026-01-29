import { useEffect } from "react";
import {
  Camera,
  MessageSquareWarning,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  XCircle,  // Tambah XCircle untuk rejected
} from "lucide-react";

// Import Complaint dari App.tsx untuk konsistensi
import { Complaint } from "../App";  // Pastikan path benar (sesuai struktur folder Anda)

interface HomePageProps {
  complaints: Complaint[];  // Sekarang menggunakan interface Complaint dari App.tsx (flat)
  onNewComplaint: () => void;
  onAdminLogin: () => void;
}

export function HomePage({
  complaints,
  onNewComplaint,
  onAdminLogin,
}: HomePageProps) {
  const getStatusColor = (status: Complaint["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";  // Tambah untuk rejected
    }
  };

  const getStatusIcon = (status: Complaint["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;  // Gunakan XCircle untuk rejected
    }
  };

  const getStatusText = (status: Complaint["status"]) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "in-progress":
        return "Diproses";
      case "completed":
        return "Selesai";
      case "rejected":
        return "Ditolak";  // Tambah untuk rejected
    }
  };

  // Fungsi untuk handle error gambar (fallback ke placeholder)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder-image.png"; // Ganti dengan path gambar placeholder yang kamu punya, atau gunakan data URL inline
  };

  // useeffect
  useEffect(() => {
    console.log("FIRST COMPLAINT:", complaints[0]);
  }, [complaints]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquareWarning className="w-10 h-10" />
            <h1>Pengaduan Masyarakat</h1>
          </div>
          <button
            onClick={onAdminLogin}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-md"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Login Admin</span>
          </button>
        </div>
        <p className="text-blue-100 mb-6">
          Sampaikan keluhan dan aspirasi Anda untuk pelayanan
          yang lebih baik
        </p>

        {/* New Complaint Button */}
        <button
          onClick={onNewComplaint}
          className="bg-white text-blue-600 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-md"
        >
          <Camera className="w-5 h-5" />
          <span>Buat Pengaduan Baru</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">  {/* 4 kolom untuk semua status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-gray-500">Menunggu</div>
              <div className="text-2xl">
                {complaints.filter((c) => c.status === "pending").length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-500">Diproses</div>
              <div className="text-2xl">
                {complaints.filter((c) => c.status === "in-progress").length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-gray-500">Selesai</div>
              <div className="text-2xl">
                {complaints.filter((c) => c.status === "completed").length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />  {/* Icon untuk rejected */}
            </div>
            <div>
              <div className="text-gray-500">Ditolak</div>
              <div className="text-2xl">
                {complaints.filter((c) => c.status === "rejected").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints History */}
      <div className="mb-4">
        <h2 className="text-gray-800 mb-4">Riwayat Pengaduan</h2>
      </div>

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <MessageSquareWarning className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada pengaduan</p>
          </div>
        ) : (
          complaints
            .filter((c) => c.status !== "rejected")  // Filter agar rejected tidak tampil di riwayat public
            .map((complaint, index) => (  // Tambah index untuk fallback key
              <div
                key={complaint.id || `complaint-${index}`}  // Gunakan id untuk unik (sudah number)
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {complaint.imageUrl ? (  // Gunakan imageUrl langsung
                    <img
                      src={complaint.imageUrl}  // Sudah full URL dari mapping App.tsx
                      alt="Laporan"
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      onError={handleImageError}  // Fallback jika gambar gagal load
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-500 text-sm">No Image</span>  
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-gray-900 mb-1">{complaint.name || "Nama tidak tersedia"}</h3>  
                        <p className="text-gray-500">{complaint.phone || "Telepon tidak tersedia"}</p>  
                        <p className="text-gray-700 mb-2">{complaint.description || "Deskripsi tidak tersedia"}</p>  
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                          
                        {getStatusIcon(complaint.status)}
                        <span className="text-sm">{getStatusText(complaint.status)}</span>
                      </div>
                    </div>


                    {complaint.response && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <p className="text-blue-900">
                          <strong>Tanggapan:</strong> {complaint.response}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{complaint.address || "Alamat tidak tersedia"}</span>  
                      <span>•</span>
                      <span>
                        {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }) : "Tanggal tidak tersedia"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}