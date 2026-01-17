import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { ComplaintForm } from './components/ComplaintForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

export interface Complaint {
  id: string;
  name: string;
  phone: string;
  address: string;
  idNumber: string;
  description: string;
  imageUrl?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  response?: string;
  createdAt: Date;
  updatedAt?: Date | null;  // Perbaikan: Tambahkan | null agar match dengan server.js
}

export type UserRole = 'public' | 'admin';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showForm, setShowForm] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);  // Diubah: Kosongkan dummy data, isi dari DB

  // Fungsi fetch data dari backend (baru ditambahkan)
  const fetchComplaints = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pengaduan');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);  // Update state dari DB
      } else {
        console.error('Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  // useEffect untuk fetch saat mount (baru ditambahkan)
  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmitComplaint = async (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => {
    // Submit sudah handle di ComplaintForm (POST ke backend)
    // Setelah submit, fetch ulang untuk sinkron dengan DB (diubah: panggil fetchComplaints)
    await fetchComplaints();
    setShowForm(false);
  };

  const handleUpdateComplaint = (id: string, updates: Partial<Complaint>) => {
    setComplaints(complaints.map(c => 
      c.id === id 
        ? { ...c, ...updates, updatedAt: new Date() }
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