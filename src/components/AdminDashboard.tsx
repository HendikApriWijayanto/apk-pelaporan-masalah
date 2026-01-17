import { useState } from 'react';
import { ShieldCheck, LogOut, Users, FileText, CheckCircle2, Clock, XCircle, MessageSquare, Printer, Search, Filter, X } from 'lucide-react';
import { Complaint } from '../App';

interface AdminDashboardProps {
  complaints: Complaint[];
  onUpdateComplaint: (id: string, updates: Partial<Complaint>) => void;
  onLogout: () => void;
}

export function AdminDashboard({ complaints, onUpdateComplaint, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'complaints' | 'citizens'>('complaints');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    includeCitizens: true,
    includeComplaints: true,
    includeResponses: true,
    includeStatus: true,
    statusFilter: 'all' as 'all' | 'pending' | 'in-progress' | 'completed' | 'rejected',
  });

  const handleValidate = (id: string, status: Complaint['status']) => {
    onUpdateComplaint(id, { status });
    if (selectedComplaint?.id === id) {
      setSelectedComplaint({ ...selectedComplaint, status });
    }
  };

  const handleSubmitResponse = (id: string) => {
    if (response.trim()) {
      onUpdateComplaint(id, { response, status: 'in-progress' });
      setResponse('');
      setSelectedComplaint(null);
    }
  };

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const generateAndDownloadReport = () => {
    let filteredComplaints = complaints;
    if (reportFilters.statusFilter !== 'all') {
      filteredComplaints = complaints.filter(c => c.status === reportFilters.statusFilter);
    }

    let reportContent = `LAPORAN PENGADUAN MASYARAKAT
Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
==================================================\n\n`;

    if (reportFilters.includeStatus) {
      reportContent += `STATISTIK:\n`;
      reportContent += `Total Pengaduan: ${filteredComplaints.length}\n`;
      reportContent += `- Menunggu: ${filteredComplaints.filter(c => c.status === 'pending').length}\n`;
      reportContent += `- Diproses: ${filteredComplaints.filter(c => c.status === 'in-progress').length}\n`;
      reportContent += `- Selesai: ${filteredComplaints.filter(c => c.status === 'completed').length}\n`;
      reportContent += `- Ditolak: ${filteredComplaints.filter(c => c.status === 'rejected').length}\n\n`;
    }

    if (reportFilters.includeCitizens) {
      const citizens = filteredComplaints.reduce((acc, complaint) => {
        if (!acc.find(c => c.phone === complaint.phone)) {
          acc.push({
            name: complaint.name,
            phone: complaint.phone,
            address: complaint.address,
            idNumber: complaint.idNumber,
          });
        }
        return acc;
      }, [] as Array<{ name: string; phone: string; address: string; idNumber: string }>);

      reportContent += `DATA MASYARAKAT:\n`;
      reportContent += `Total Warga yang Melapor: ${citizens.length}\n`;
      citizens.forEach((citizen, i) => {
        reportContent += `${i + 1}. ${citizen.name}\n`;
        reportContent += `   No. HP: ${citizen.phone}\n`;
        reportContent += `   Alamat: ${citizen.address}\n`;
        if (citizen.idNumber) {
          reportContent += `   NIK: ${citizen.idNumber}\n`;
        }
        reportContent += `\n`;
      });
      reportContent += `\n`;
    }

    if (reportFilters.includeComplaints) {
      reportContent += `DETAIL PENGADUAN:\n`;
      filteredComplaints.forEach((c, i) => {
        reportContent += `${i + 1}. PENGADUAN #${c.id}\n`;
        reportContent += `   Pelapor: ${c.name}\n`;
        reportContent += `   No. HP: ${c.phone}\n`;
        reportContent += `   Alamat: ${c.address}\n`;
        reportContent += `   Tanggal: ${new Date(c.createdAt).toLocaleDateString('id-ID')}\n`;
        if (reportFilters.includeStatus) {
          reportContent += `   Status: ${getStatusText(c.status)}\n`;
        }
        reportContent += `   Deskripsi: ${c.description}\n`;
        if (reportFilters.includeResponses && c.response) {
          reportContent += `   Tanggapan: ${c.response}\n`;
          if (c.updatedAt) {
            reportContent += `   Tanggal Tanggapan: ${new Date(c.updatedAt).toLocaleDateString('id-ID')}\n`;
          }
        }
        reportContent += `\n`;
      });
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-pengaduan-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowReportModal(false);
  };

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'in-progress':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      case 'rejected':
        return 'Ditolak';
    }
  };

  // Get unique citizens
  const citizens = complaints.reduce((acc, complaint) => {
    if (!acc.find(c => c.phone === complaint.phone)) {
      acc.push({
        name: complaint.name,
        phone: complaint.phone,
        address: complaint.address,
        idNumber: complaint.idNumber,
        totalComplaints: complaints.filter(c => c.phone === complaint.phone).length,
      });
    }
    return acc;
  }, [] as Array<{ name: string; phone: string; address: string; idNumber: string; totalComplaints: number }>);

  // Filter complaints based on search
  const filteredComplaints = complaints.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter citizens based on search
  const filteredCitizens = citizens.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-gray-900">Dashboard Admin</h1>
                <p className="text-gray-600">Kelola pengaduan masyarakat</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-gray-500">Menunggu</div>
                <div className="text-2xl">{complaints.filter(c => c.status === 'pending').length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-gray-500">Diproses</div>
                <div className="text-2xl">{complaints.filter(c => c.status === 'in-progress').length}</div>
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
                <div className="text-2xl">{complaints.filter(c => c.status === 'completed').length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-gray-500">Warga</div>
                <div className="text-2xl">{citizens.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'complaints' ? 'Cari pengaduan...' : 'Cari masyarakat...'}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>Generate Laporan</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'complaints'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Data Pengaduan</span>
          </button>
          <button
            onClick={() => setActiveTab('citizens')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'citizens'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Data Masyarakat</span>
          </button>
        </div>

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada pengaduan ditemukan</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex gap-4">
                    {complaint.imageUrl && (
                      <img
                        src={`http://localhost:5000${complaint.imageUrl}`}
                        alt="Laporan"
                        className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-gray-900 mb-1">{complaint.name}</h3>
                          <p className="text-gray-600">{complaint.phone} • {complaint.address}</p>
                          {complaint.idNumber && (
                            <p className="text-gray-500">NIK: {complaint.idNumber}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(complaint.status)}`}>
                          {getStatusText(complaint.status)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{complaint.description}</p>
                      
                      {complaint.response && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-blue-900">
                            <strong>Tanggapan:</strong> {complaint.response}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span>{new Date(complaint.createdAt).toLocaleDateString('id-ID')}</span>
                        {complaint.updatedAt && (
                          <>
                            <span>•</span>
                            <span>Diperbarui: {new Date(complaint.updatedAt).toLocaleDateString('id-ID')}</span>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {complaint.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleValidate(complaint.id, 'in-progress')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Validasi & Proses
                            </button>
                            <button
                              onClick={() => handleValidate(complaint.id, 'rejected')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        
                        {(complaint.status === 'in-progress' || complaint.status === 'pending') && (
                          <button
                            onClick={() => setSelectedComplaint(complaint)}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Beri Tanggapan
                          </button>
                        )}
                        
                        {complaint.status === 'in-progress' && (
                          <button
                            onClick={() => handleValidate(complaint.id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Tandai Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Citizens Tab */}
        {activeTab === 'citizens' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredCitizens.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data masyarakat ditemukan</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-700">Nama</th>
                    <th className="px-6 py-4 text-left text-gray-700">No. HP</th>
                    <th className="px-6 py-4 text-left text-gray-700">Alamat</th>
                    <th className="px-6 py-4 text-left text-gray-700">NIK</th>
                    <th className="px-6 py-4 text-left text-gray-700">Total Pengaduan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCitizens.map((citizen, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{citizen.name}</td>
                      <td className="px-6 py-4 text-gray-700">{citizen.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{citizen.address}</td>
                      <td className="px-6 py-4 text-gray-700">{citizen.idNumber || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {citizen.totalComplaints}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-gray-900 mb-4">Beri Tanggapan</h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 mb-1">{selectedComplaint.name}</p>
              <p className="text-gray-600">{selectedComplaint.description}</p>
            </div>

            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              placeholder="Tulis tanggapan untuk pengaduan ini..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setResponse('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleSubmitResponse(selectedComplaint.id)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kirim Tanggapan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Generate Laporan</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-3">Pilih Jenis Data:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={reportFilters.includeCitizens}
                      onChange={(e) => setReportFilters({ ...reportFilters, includeCitizens: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Data Masyarakat</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={reportFilters.includeComplaints}
                      onChange={(e) => setReportFilters({ ...reportFilters, includeComplaints: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Data Pengaduan</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={reportFilters.includeResponses}
                      onChange={(e) => setReportFilters({ ...reportFilters, includeResponses: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Tanggapan</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={reportFilters.includeStatus}
                      onChange={(e) => setReportFilters({ ...reportFilters, includeStatus: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Status</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Filter Status Pengaduan:</label>
                <select
                  value={reportFilters.statusFilter}
                  onChange={(e) => setReportFilters({ ...reportFilters, statusFilter: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="in-progress">Diproses</option>
                  <option value="completed">Selesai</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={generateAndDownloadReport}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                <span>Download Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
