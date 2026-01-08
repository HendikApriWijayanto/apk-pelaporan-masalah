import { useState } from 'react';
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
  updatedAt?: Date;
}

export type UserRole = 'public' | 'admin';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showForm, setShowForm] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: '1',
      name: 'Ahmad Wijaya',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 123, Jakarta',
      idNumber: '3174012345678901',
      description: 'Jalan berlubang di depan rumah menyebabkan kemacetan dan membahayakan pengendara motor',
      imageUrl: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800',
      status: 'in-progress',
      response: 'Tim sudah ditugaskan untuk perbaikan jalan. Estimasi selesai 3 hari.',
      createdAt: new Date('2024-12-15'),
      updatedAt: new Date('2024-12-16'),
    },
    {
      id: '2',
      name: 'Siti Nurhaliza',
      phone: '082345678901',
      address: 'Jl. Sudirman No. 45, Bandung',
      idNumber: '3273012345678902',
      description: 'Lampu jalan mati sejak 3 hari yang lalu, mengakibatkan area menjadi gelap dan rawan kejahatan',
      imageUrl: 'https://images.unsplash.com/photo-1518893063132-36e46dbe2428?w=800',
      status: 'pending',
      createdAt: new Date('2024-12-16'),
    },
    {
      id: '3',
      name: 'Budi Santoso',
      phone: '083456789012',
      address: 'Jl. Gatot Subroto No. 78, Surabaya',
      idNumber: '3578012345678903',
      description: 'Sampah menumpuk di TPS selama seminggu tidak diangkut, menimbulkan bau tidak sedap',
      imageUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800',
      status: 'completed',
      response: 'Sampah telah diangkut dan jadwal pengangkutan rutin akan diperbaiki.',
      createdAt: new Date('2024-12-10'),
      updatedAt: new Date('2024-12-14'),
    },
  ]);

  const handleSubmitComplaint = (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => {
    const newComplaint: Complaint = {
      ...complaint,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date(),
    };
    setComplaints([newComplaint, ...complaints]);
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
