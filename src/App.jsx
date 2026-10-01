import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png';
import { 
  LuMessageSquare, 
  LuLogOut, 
  LuSearch, 
  LuBell, 
  LuCalendarClock,
  LuLock,
  LuMenu,
  LuX,
  LuImage,
  LuLayoutDashboard,
  LuTrash2
} from 'react-icons/lu';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, enquiry, gallery

  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [readEnquiries, setReadEnquiries] = useState(() => {
    try {
      const saved = localStorage.getItem('readEnquiries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedEnquiry) {
        setSelectedEnquiry(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEnquiry]);

  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'enquiry' || activeTab === 'dashboard') {
        fetchEnquiries();
      }
      if (activeTab === 'gallery') {
        fetchGallery();
      }
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'rkwater123') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setEnquiries([]);
    setGalleryImages([]);
  };

  const fetchEnquiries = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingEnquiries(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contacts`);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      if (showLoading) setLoadingEnquiries(false);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contacts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEnquiries(prev => prev.filter(e => e._id !== id));
        if (selectedEnquiry && selectedEnquiry._id === id) {
          setSelectedEnquiry(null);
        }
      } else {
        alert('Failed to delete enquiry');
      }
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
      alert('Error deleting enquiry');
    }
  };

  const fetchGallery = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingGallery(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`);
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      if (showLoading) setLoadingGallery(false);
    }
  };

  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert('Please select an image file to upload.');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Invalid file type! Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      e.target.value = null;
      return;
    }

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert('File size too large! Maximum allowed image size is 8MB.');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setUploadingImage(true);
      setUploadSuccessMsg('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: uploadTitle.trim(), imageData: base64String })
        });
        const data = await res.json();
        if (res.ok) {
          setUploadSuccessMsg('Image uploaded successfully.');
          setUploadTitle('');
          fetchGallery(false);
          setTimeout(() => setUploadSuccessMsg(''), 4000);
        } else {
          alert(data.message || 'Upload failed. Please try again.');
        }
      } catch (err) {
        console.error('Error uploading image', err);
        alert('Upload failure. Please check your internet or server connection.');
      } finally {
        setUploadingImage(false);
        e.target.value = null;
      }
    };
    reader.onerror = () => {
      alert('Error reading image file.');
      e.target.value = null;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchGallery(false);
      } else {
        alert('Failed to delete image. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting image', err);
      alert('Error deleting image.');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-[#DDE5DF]">
          <div className="text-center mb-8">
            <div className="w-32 h-auto mx-auto mb-4 flex items-center justify-center">
              <img src={logo} alt="RK Water Proofing Logo" className="w-full object-contain drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black text-[#17211D]">Admin Login</h1>
            <p className="text-sm text-[#68736D] mt-2">Sign in to manage your enquiries</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-[#17211D] mb-1.5">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F5EF] border-transparent focus:bg-white focus:border-[#1F8A70] focus:ring-2 focus:ring-[#1F8A70]/20 transition-all outline-none"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#17211D] mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F5EF] border-transparent focus:bg-white focus:border-[#1F8A70] focus:ring-2 focus:ring-[#1F8A70]/20 transition-all outline-none"
                placeholder="Enter password"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3.5 bg-[#1F8A70] hover:bg-[#12372A] text-white font-extrabold rounded-xl shadow-md transition-colors"
            >
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-gray-800 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 w-64 bg-[#12372A] text-white flex flex-col shadow-xl z-30 transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-[#1F8A70]/30 flex flex-col items-start bg-white relative">
          <img src={logo} alt="RK Water Proofing Logo" className="h-10 object-contain mb-2 drop-shadow-sm" />
          <p className="text-xs font-black text-[#12372A] uppercase tracking-widest pl-1">Admin Portal</p>
          <button 
            className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-[#1F8A70] text-white shadow-md' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <div className="flex items-center gap-3">
              <LuLayoutDashboard className="w-5 h-5" />
              <span className="font-semibold text-sm">Dashboard</span>
            </div>
          </button>

          <button 
            onClick={() => { setActiveTab('enquiry'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === 'enquiry' ? 'bg-[#1F8A70] text-white shadow-md' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <div className="flex items-center gap-3">
              <LuMessageSquare className="w-5 h-5" />
              <span className="font-semibold text-sm">Enquiry</span>
            </div>
            {enquiries.filter(e => !readEnquiries.includes(e._id)).length > 0 && (
              <span className="bg-[#D8B77A] text-[#12372A] text-xs font-bold px-2 py-0.5 rounded-full">
                {enquiries.filter(e => !readEnquiries.includes(e._id)).length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('gallery'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === 'gallery' ? 'bg-[#1F8A70] text-white shadow-md' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <div className="flex items-center gap-3">
              <LuImage className="w-5 h-5" />
              <span className="font-semibold text-sm">Gallery</span>
            </div>
          </button>
        </nav>
        
        <div className="p-4 border-t border-[#1F8A70]/30">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <LuLogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="lg:hidden text-gray-500 hover:text-[#1F8A70] transition-colors p-1"
              onClick={() => setIsSidebarOpen(true)}
            >
              <LuMenu className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-sm hidden sm:block">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:border-[#1F8A70] focus:ring-2 focus:ring-[#1F8A70]/20 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-[#1F8A70] text-white flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Admin</p>
                <p className="text-xs text-gray-500">Superuser</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Overview of your business metrics.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-bold">Total Enquiries</h3>
                  <p className="text-3xl font-black text-[#12372A] mt-2">{enquiries.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-bold">Gallery Images</h3>
                  <p className="text-3xl font-black text-[#12372A] mt-2">{galleryImages.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enquiry Tab */}
          {activeTab === 'enquiry' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Customer Enquiries</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and respond to service requests.</p>
                </div>
                <button 
                  onClick={fetchEnquiries}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <LuCalendarClock className="w-4 h-4" /> Refresh List
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold text-gray-500">
                        <th className="py-4 px-6">Customer Details</th>
                        <th className="py-4 px-6">Service Required</th>
                        <th className="py-4 px-6">Message / Requirements</th>
                        <th className="py-4 px-6">Date Received</th>
                        <th className="py-4 px-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingEnquiries ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-400">Loading enquiries...</td>
                        </tr>
                      ) : enquiries.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-400">No enquiries found.</td>
                        </tr>
                      ) : (
                        enquiries.map((enq) => (
                          <tr key={enq._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-gray-800">{enq.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{enq.phone}</p>
                              {enq.email && (
                                <a href={`mailto:${enq.email}`} className="text-xs text-gray-500 mt-0.5 hover:text-[#1F8A70] hover:underline block">
                                  {enq.email}
                                </a>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF4EF] text-[#1F8A70]">
                                {enq.service}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">{enq.message}</p>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <p className="text-sm text-gray-600">{formatDate(enq.createdAt)}</p>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedEnquiry(enq);
                                    if (!readEnquiries.includes(enq._id)) {
                                      const newRead = [...readEnquiries, enq._id];
                                      setReadEnquiries(newRead);
                                      localStorage.setItem('readEnquiries', JSON.stringify(newRead));
                                    }
                                  }}
                                  className={`inline-flex items-center px-3 py-1.5 ${readEnquiries.includes(enq._id) ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-[#EAF4EF] hover:bg-[#D4EBE0] text-[#1F8A70]'} text-xs font-bold rounded-lg transition-colors shadow-sm`}
                                >
                                  View
                                </button>
                                <a 
                                  href={`https://wa.me/91${enq.phone.replace(/\D/g, '')}?text=Hello ${enq.name}, regarding your enquiry for ${enq.service}...`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 bg-[#12372A] hover:bg-[#1F8A70] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  Reply via WA
                                </a>
                                <button
                                  onClick={() => handleDeleteEnquiry(enq._id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Enquiry"
                                >
                                  <LuTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enquiry Details Modal */}
              {selectedEnquiry && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4"
                  onClick={() => setSelectedEnquiry(null)}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[#E8F0EC] bg-white">
                      <h3 className="font-black text-[#12372A] text-lg">Enquiry Details</h3>
                      <button 
                        onClick={() => setSelectedEnquiry(null)}
                        className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                      >
                        <LuX className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Body */}
                    <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
                      
                      {/* Customer Information */}
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0D7A5F] mb-3 pl-1">Customer Information</h4>
                        <div className="bg-[#F9FAF9] rounded-2xl p-4 border border-[#E8F0EC] space-y-4 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 mb-0.5">Name</span>
                            <span className="text-sm font-bold text-[#17211D]">{selectedEnquiry.name || 'Not provided'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 mb-0.5">Phone</span>
                            {selectedEnquiry.phone ? (
                              <a href={`tel:${selectedEnquiry.phone}`} className="text-sm font-bold text-[#1F8A70] hover:underline">
                                {selectedEnquiry.phone}
                              </a>
                            ) : (
                              <span className="text-sm font-bold text-[#17211D]">Not provided</span>
                            )}
                          </div>
                          {selectedEnquiry.email && (
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-500 mb-0.5">Email</span>
                              <a href={`mailto:${selectedEnquiry.email}`} className="text-sm font-bold text-[#1F8A70] hover:underline">
                                {selectedEnquiry.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Service Details */}
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0D7A5F] mb-3 pl-1">Service Details</h4>
                        <div className="bg-[#F9FAF9] rounded-2xl p-4 border border-[#E8F0EC] shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 mb-1.5">Service Required</span>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E8F5EE] text-[#0D7A5F] w-fit border border-[#D1E8DD]">
                              {selectedEnquiry.service || 'Not provided'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enquiry Details */}
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0D7A5F] mb-3 pl-1">Enquiry Details</h4>
                        <div className="bg-[#F9FAF9] rounded-2xl p-4 border border-[#E8F0EC] space-y-4 shadow-sm">
                          {selectedEnquiry.address && (
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-500 mb-0.5">Address</span>
                              <span className="text-sm font-medium text-[#17211D] leading-relaxed">{selectedEnquiry.address}</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 mb-0.5">Message</span>
                            <span className="text-sm font-medium text-[#17211D] leading-relaxed whitespace-pre-wrap">{selectedEnquiry.message || 'Not provided'}</span>
                          </div>
                          
                          {/* Dynamically render any other fields not explicitly handled */}
                          {Object.keys(selectedEnquiry).map((key) => {
                            if (['name', 'phone', 'email', 'service', 'address', 'message', 'createdAt', 'updatedAt', '_id', '__v'].includes(key)) return null;
                            const val = selectedEnquiry[key];
                            if (val === null || val === undefined || val === '') return null;
                            return (
                              <div className="flex flex-col" key={key}>
                                <span className="text-xs font-semibold text-gray-500 mb-0.5 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-sm font-medium text-[#17211D] leading-relaxed">{String(val)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Submission Details */}
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0D7A5F] mb-3 pl-1">Submission Details</h4>
                        <div className="bg-[#F9FAF9] rounded-2xl p-4 border border-[#E8F0EC] shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 mb-0.5">Submitted At</span>
                            <span className="text-sm font-bold text-[#17211D]">
                              {selectedEnquiry.createdAt ? formatDate(selectedEnquiry.createdAt) : 'Not provided'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#E8F0EC] bg-white flex justify-between items-center">
                      <button 
                        onClick={() => handleDeleteEnquiry(selectedEnquiry._id)}
                        className="px-4 py-2 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                      >
                        <LuTrash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button 
                        onClick={() => setSelectedEnquiry(null)}
                        className="px-6 py-2.5 bg-white border border-[#DDE5DF] text-[#12372A] font-bold rounded-xl shadow-sm hover:bg-[#F9FAF9] transition-colors text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Gallery Management</h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">Upload and manage project images displayed on the customer website.</p>
                
                {uploadSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-[#0D7A5F] rounded-xl text-sm font-semibold flex items-center justify-between">
                    <span>{uploadSuccessMsg}</span>
                    <button onClick={() => setUploadSuccessMsg('')} className="text-gray-400 hover:text-gray-600">
                      <LuX className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Form - Responsive Stacking */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Image Title (optional)" 
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F5EF] border border-[#DDE5DF] rounded-xl text-sm outline-none focus:bg-white focus:border-[#1F8A70] focus:ring-2 focus:ring-[#1F8A70]/20 transition-all"
                    />
                  </div>
                  <label className={`px-6 py-2.5 bg-[#1F8A70] hover:bg-[#12372A] text-white font-extrabold rounded-xl shadow-md transition-all text-sm cursor-pointer flex items-center justify-center gap-2 ${uploadingImage ? 'opacity-70 pointer-events-none' : ''}`}>
                    <LuImage className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage} 
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Gallery Images Grid */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>Uploaded Gallery Images</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF4EF] text-[#1F8A70]">
                    {galleryImages.length}
                  </span>
                </h3>

                {loadingGallery ? (
                  <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                    <div className="w-8 h-8 mx-auto border-4 border-gray-200 border-t-[#1F8A70] rounded-full animate-spin mb-2" />
                    <p className="text-sm font-medium">Loading gallery images...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {galleryImages.map(img => (
                      <div key={img._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow">
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                          <img src={img.imageData} alt={img.title || 'Gallery item'} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => handleDeleteImage(img._id)}
                            className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-xl transition-all shadow-md flex items-center gap-1 text-xs font-semibold"
                            title="Delete Image"
                          >
                            <LuTrash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {img.title || <span className="text-gray-400 font-normal italic">No Title</span>}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {img.createdAt ? formatDate(img.createdAt) : 'Uploaded'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {galleryImages.length === 0 && (
                      <div className="col-span-full text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                        <LuImage className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-base font-bold text-gray-700">No Uploaded Images</p>
                        <p className="text-xs text-gray-500 mt-1">Upload an image above to populate the website gallery.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
      
    </div>
  );
};

export default App;
