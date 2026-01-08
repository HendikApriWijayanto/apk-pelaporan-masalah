import { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => boolean;
  onCancel: () => void;
}

export function AdminLogin({ onLogin, onCancel }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email wajib diisi');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Format email tidak valid');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password wajib diisi');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Simulate loading
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const success = onLogin(email, password);
      if (!success) {
        setError('Email atau password salah. Silakan coba lagi.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={onCancel}
          className="mb-4 text-white flex items-center gap-2 hover:underline transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Halaman Utama
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-5 rounded-2xl">
              <ShieldCheck className="w-14 h-14 text-blue-600" />
            </div>
          </div>

          <h1 className="text-center text-gray-900 mb-2">Login Admin</h1>
          <p className="text-center text-gray-600 mb-8">
            Silakan masuk untuk mengelola pengaduan masyarakat
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setError('');
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full pl-11 pr-4 py-3 border ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    emailError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="admin@pengaduan.go.id"
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setError('');
                  }}
                  onBlur={() => validatePassword(password)}
                  className={`w-full pl-11 pr-12 py-3 border ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    passwordError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* General Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Kredensial Demo:</strong>
            </p>
            <div className="space-y-1 text-sm text-blue-800">
              <p>Email: <code className="bg-blue-100 px-2 py-0.5 rounded">admin@pengaduan.go.id</code></p>
              <p>Password: <code className="bg-blue-100 px-2 py-0.5 rounded">admin123</code></p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <Lock className="w-3 h-3 inline mr-1" />
              Akses terbatas hanya untuk administrator resmi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
