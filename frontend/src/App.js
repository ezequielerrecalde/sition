import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // You could verify token validity here
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('token', tokenData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Login Component
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API_BASE}${endpoint}`, payload);
      
      login(response.data.user, response.data.access_token);
      navigate('/workspace');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Accede a tu workspace' : 'Únete a Notion'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isLogin ? '¿No tienes cuenta? Registrarse' : '¿Ya tienes cuenta? Iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Data Context for workspace
const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadWorkspaces = async () => {
    try {
      const response = await axios.get(`${API_BASE}/workspaces`);
      setWorkspaces(response.data);
      if (response.data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const loadPages = async (workspaceId) => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/workspaces/${workspaceId}/pages`);
      setPages(response.data);
      if (response.data.length > 0 && !currentPage) {
        setCurrentPage(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (pageData) => {
    try {
      const response = await axios.post(`${API_BASE}/workspaces/${currentWorkspace.id}/pages`, pageData);
      setPages([...pages, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  };

  const updatePage = async (pageId, updates) => {
    try {
      const response = await axios.put(`${API_BASE}/pages/${pageId}`, updates);
      setPages(pages.map(p => p.id === pageId ? response.data : p));
      if (currentPage?.id === pageId) {
        setCurrentPage(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  };

  const deletePage = async (pageId) => {
    try {
      await axios.delete(`${API_BASE}/pages/${pageId}`);
      setPages(pages.filter(p => p.id !== pageId));
      if (currentPage?.id === pageId) {
        setCurrentPage(pages.find(p => p.id !== pageId) || null);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      pages,
      currentPage,
      setCurrentPage,
      loading,
      loadWorkspaces,
      loadPages,
      createPage,
      updatePage,
      deletePage
    }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => useContext(DataContext);

// Sidebar Component
const Sidebar = ({ isOpen, onToggle }) => {
  const { workspaces, currentWorkspace, pages, currentPage, setCurrentPage, createPage } = useData();
  const [expandedSections, setExpandedSections] = useState({
    workspace: true,
    favorites: true,
    private: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNewPage = async () => {
    try {
      const newPage = await createPage({
        title: 'Nueva página',
        content: '',
        type: 'page',
        icon: 'FileText',
        workspace_id: currentWorkspace?.id
      });
      setCurrentPage(newPage);
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  const favoritePages = pages.filter(p => p.is_favorite);
  const regularPages = pages.filter(p => !p.is_favorite);

  return (
    <motion.div
      initial={{ width: isOpen ? 240 : 0 }}
      animate={{ width: isOpen ? 240 : 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="bg-gray-50 border-r border-gray-200 h-full overflow-hidden flex flex-col"
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-semibold text-gray-900 truncate">
              {currentWorkspace?.name || 'Mi Workspace'}
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-2 p-2 hover:bg-gray-200 rounded text-sm text-left">
            <Icons.Search className="w-4 h-4" />
            <span>Buscar</span>
            <span className="ml-auto text-xs text-gray-500">⌘K</span>
          </button>
          <button className="w-full flex items-center space-x-2 p-2 hover:bg-gray-200 rounded text-sm text-left">
            <Icons.Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          {/* Favorites */}
          {favoritePages.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('favorites')}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <Icons.ChevronRight 
                  className={`w-3 h-3 transition-transform ${expandedSections.favorites ? 'rotate-90' : ''}`} 
                />
                <span className="font-medium">Favoritos</span>
              </button>
              {expandedSections.favorites && (
                <div className="ml-5 space-y-1">
                  {favoritePages.map((page) => {
                    const IconComponent = Icons[page.icon] || Icons.FileText;
                    return (
                      <button
                        key={page.id}
                        onClick={() => setCurrentPage(page)}
                        className={`flex items-center space-x-2 p-1 hover:bg-gray-200 rounded text-sm w-full text-left ${
                          currentPage?.id === page.id ? 'bg-gray-200' : ''
                        }`}
                      >
                        <Icons.Star className="w-4 h-4 text-yellow-500" />
                        <span className="truncate">{page.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Private Pages */}
          <div>
            <button
              onClick={() => toggleSection('private')}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <Icons.ChevronRight 
                className={`w-3 h-3 transition-transform ${expandedSections.private ? 'rotate-90' : ''}`} 
              />
              <span className="font-medium">Privado</span>
            </button>
            {expandedSections.private && (
              <div className="ml-5 space-y-1">
                {regularPages.map((page) => {
                  const IconComponent = Icons[page.icon] || Icons.FileText;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center space-x-2 p-1 hover:bg-gray-200 rounded text-sm w-full text-left ${
                        currentPage?.id === page.id ? 'bg-gray-200' : ''
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="truncate">{page.title}</span>
                    </button>
                  );
                })}
                <button
                  onClick={handleNewPage}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-200 rounded text-sm w-full text-left text-gray-500"
                >
                  <Icons.Plus className="w-4 h-4" />
                  <span>Agregar página</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Header Component
const Header = ({ onSidebarToggle, currentPage }) => {
  const { logout } = useAuth();
  const { currentWorkspace } = useData();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onSidebarToggle}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <Icons.Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          {currentWorkspace && (
            <>
              <span className="text-sm text-gray-500">{currentWorkspace.name}</span>
              {currentPage && (
                <>
                  <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{currentPage.title}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button className="p-2 hover:bg-gray-200 rounded">
          <Icons.Share className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-200 rounded">
          <Icons.MessageSquare className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-200 rounded">
          <Icons.Bell className="w-4 h-4" />
        </button>
        <button
          onClick={logout}
          className="p-2 hover:bg-gray-200 rounded"
          title="Cerrar sesión"
        >
          <Icons.LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

// Page Editor Component
const PageEditor = () => {
  const { currentPage, updatePage } = useData();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPage) {
      setContent(currentPage.content || '');
      setTitle(currentPage.title || '');
    }
  }, [currentPage]);

  const handleContentChange = async (value) => {
    setContent(value);
    await saveChanges({ content: value });
  };

  const handleTitleChange = async (value) => {
    setTitle(value);
    await saveChanges({ title: value });
  };

  const saveChanges = async (updates) => {
    if (!currentPage) return;
    
    try {
      setSaving(true);
      await updatePage(currentPage.id, updates);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecciona una página</h2>
          <p className="text-gray-600">Elige una página de la barra lateral para empezar a trabajar</p>
        </div>
      </div>
    );
  }

  if (currentPage.type === 'database') {
    return <DatabaseView />;
  }

  return (
    <div className="flex-1 bg-white relative">
      {saving && (
        <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          Guardando...
        </div>
      )}
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título de la página"
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none bg-transparent"
          />
        </div>
        
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Escribe algo..."
            className="w-full min-h-96 text-base text-gray-900 placeholder-gray-400 border-none outline-none resize-none bg-transparent leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};

// Database View Component
const DatabaseView = () => {
  const { currentPage } = useData();
  const [viewType, setViewType] = useState('table');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentPage && currentPage.type === 'database') {
      loadRecords();
    }
  }, [currentPage]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/pages/${currentPage.id}/records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
      // Use mock data if API fails
      setRecords([
        { id: '1', data: { title: 'Revisar propuesta', status: 'En progreso', priority: 'Alta', date: '2025-01-15' }},
        { id: '2', data: { title: 'Llamar al cliente', status: 'Pendiente', priority: 'Media', date: '2025-01-16' }},
        { id: '3', data: { title: 'Actualizar documentación', status: 'Completado', priority: 'Baja', date: '2025-01-14' }}
      ]);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    'Pendiente': 'bg-gray-100 text-gray-800',
    'En progreso': 'bg-blue-100 text-blue-800',
    'Completado': 'bg-green-100 text-green-800'
  };

  const priorityColors = {
    'Alta': 'bg-red-100 text-red-800',
    'Media': 'bg-yellow-100 text-yellow-800',
    'Baja': 'bg-gray-100 text-gray-800'
  };

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Título</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Prioridad</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  <Icons.FileText className="w-4 h-4 text-gray-400" />
                  <span>{record.data.title}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.data.status]}`}>
                  {record.data.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[record.data.priority]}`}>
                  {record.data.priority}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{record.data.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const KanbanView = () => (
    <div className="grid grid-cols-3 gap-6">
      {['Pendiente', 'En progreso', 'Completado'].map((status) => (
        <div key={status} className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
            {status}
            <span className="text-sm text-gray-500">
              {records.filter(record => record.data.status === status).length}
            </span>
          </h3>
          <div className="space-y-3">
            {records.filter(record => record.data.status === status).map((record) => (
              <div key={record.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="font-medium text-gray-900 mb-2">{record.data.title}</div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[record.data.priority]}`}>
                    {record.data.priority}
                  </span>
                  <span className="text-xs text-gray-500">{record.data.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 bg-white">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentPage?.title}</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewType === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icons.Table className="w-4 h-4" />
                  <span>Tabla</span>
                </div>
              </button>
              <button
                onClick={() => setViewType('kanban')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewType === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icons.Columns className="w-4 h-4" />
                  <span>Kanban</span>
                </div>
              </button>
            </div>
            
            <button className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Icons.Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Icons.Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            viewType === 'table' ? <TableView /> : <KanbanView />
          )}
        </div>
      </div>
    </div>
  );
};

// Main Workspace Component
const WorkspaceApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { loadWorkspaces, loadPages, currentWorkspace, currentPage } = useData();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      loadPages(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header 
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <PageEditor />
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icons.Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/workspace" 
                element={
                  <ProtectedRoute>
                    <WorkspaceApp />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/workspace" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;