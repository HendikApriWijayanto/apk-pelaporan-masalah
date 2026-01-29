import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL;
import { HomePage } from './components/HomePage';
import { ComplaintForm } from './components/ComplaintForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';



export interface Complaint {
  id: number;  // Match server (id_pengaduan adalah number)
  name: string;
  phone: string ;  // Match server (no_hp adalah number | null, tapi konversi ke string)
  address: string;
  idNumber: string;
  description: string;
  imageUrl?: string;  // Diambil dari foto[0]?.url jika ada
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  response?: string;
  createdAt: string;  // Match server (created_at adalah string)
  updatedAt?: string | null;  // Match server (updated_at adalah string | null)
}

export type UserRole = 'public' | 'admin';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showForm, setShowForm] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Fungsi fetch dengan error handling tambahan
  const fetchComplaints = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pengaduan`);
      console.log("API_URL =", API_URL);

      if (response.ok) {
        const data = await response.json();
        // Map data dari server ke interface Complaint dengan pengecekan null
        const mappedComplaints: Complaint[] = data
          .filter((p: any) => p.masyarakat)  // Filter jika masyarakat null
          .map((p: any) => ({
            id: p.id_pengaduan,  // number
            name: p.masyarakat.nama,  // dari nested masyarakat
            phone: p.masyarakat.no_hp ? p.masyarakat.no_hp.toString() : null,  // konversi ke string | null
            address: p.masyarakat.alamat,  // dari nested masyarakat
            idNumber: p.masyarakat.nik,  // string (sudah dikonversi di server)
            description: p.deskripsi,  // langsung dari p
            imageUrl: p.foto && p.foto.length > 0 ? p.foto[0].url : undefined,  // ambil dari foto[0] jika ada
            status: p.status,
            response: p.response || undefined,
            createdAt: p.createdAt,  // string
            updatedAt: p.updatedAt || null,  // string | null
          }));
        setComplaints(mappedComplaints);  // Update state dari DB
      } else {
        console.error('Failed to fetch complaints:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  // useEffect untuk fetch saat mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmitComplaint = async (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => {
    // Submit sudah handle di ComplaintForm (POST ke backend)
    // Setelah submit, fetch ulang untuk sinkron dengan DB
    await fetchComplaints();
    setShowForm(false);
  };

  const handleUpdateComplaint = (id: number, updates: Partial<Complaint>) => {
    setComplaints(complaints.map(c => 
      c.id === id 
        ? { ...c, ...updates, updatedAt: new Date().toISOString() }  // updatedAt sebagai string
        : c
    ));
  };

  const handleAdminLogin = (email: string, password: string) => {
    // Simple validation - in production, this would check against a database
    if (email === 'admin@pengaduan.go.id' && password === 'admin123') {
      setUserRole('admin');
      setShowAdminLogin(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUserRole('public');
  };

  if (showAdminLogin) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onCancel={() => setShowAdminLogin(false)}
      />
    );
  }

  if (userRole === 'admin') {
    return (
      <AdminDashboard
        complaints={complaints}
        onUpdateComplaint={handleUpdateComplaint}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showForm ? (
        <ComplaintForm
          onSubmit={handleSubmitComplaint}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <HomePage
          complaints={complaints}
          onNewComplaint={() => setShowForm(true)}
          onAdminLogin={() => setShowAdminLogin(true)}
        />
      )}
    </div>
  );
}