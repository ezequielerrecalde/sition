import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import './App.css';
import './components';

// Mock data
const mockPages = [
  { id: 1, title: 'Página de inicio', icon: 'Home', type: 'page', content: '# Bienvenido a tu workspace\n\nEsta es tu página principal. Puedes empezar escribiendo aquí o crear nuevas páginas en la barra lateral.' },
  { id: 2, title: 'Proyecto Team Alpha', icon: 'FolderOpen', type: 'page', content: '# Proyecto Team Alpha\n\n## Objetivos\n- [ ] Completar diseño UI\n- [ ] Implementar backend\n- [ ] Testing completo\n\n## Notas del equipo\nEste proyecto está progresando bien...' },
  { id: 3, title: 'Tareas personales', icon: 'CheckSquare', type: 'database', data: [
    { id: 1, title: 'Revisar propuesta', status: 'En progreso', priority: 'Alta', date: '2025-01-15' },
    { id: 2, title: 'Llamar al cliente', status: 'Pendiente', priority: 'Media', date: '2025-01-16' },
    { id: 3, title: 'Actualizar documentación', status: 'Completado', priority: 'Baja', date: '2025-01-14' }
  ]},
  { id: 4, title: 'Ideas y brainstorming', icon: 'Lightbulb', type: 'page', content: '# Ideas y brainstorming\n\n## Nuevas funcionalidades\n- Integración con calendarios\n- Modo presentación\n- Colaboración en tiempo real\n\n## Mejoras UX\n- Drag & drop mejorado\n- Shortcuts de teclado\n- Temas personalizados' }
];

const mockTemplates = [
  { id: 1, title: 'Notas de reunión', description: 'Plantilla para documentar reuniones', icon: 'Users' },
  { id: 2, title: 'Plan de proyecto', description: 'Organiza tu proyecto paso a paso', icon: 'Target' },
  { id: 3, title: 'Lista de tareas', description: 'Gestiona tus tareas diarias', icon: 'CheckSquare' },
  { id: 4, title: 'Base de conocimiento', description: 'Documenta y comparte conocimiento', icon: 'BookOpen' }
];

// Sidebar Component
const Sidebar = ({ isOpen, onToggle, currentPage, onPageSelect, onNewPage }) => {
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
            <span className="font-semibold text-gray-900">Mi Workspace</span>
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
                <button className="flex items-center space-x-2 p-1 hover:bg-gray-200 rounded text-sm w-full text-left">
                  <Icons.Star className="w-4 h-4 text-yellow-500" />
                  <span>Página de inicio</span>
                </button>
              </div>
            )}
          </div>

          {/* Private */}
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
                {mockPages.map((page) => {
                  const IconComponent = Icons[page.icon] || Icons.FileText;
                  return (
                    <button
                      key={page.id}
                      onClick={() => onPageSelect(page)}
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
                  onClick={onNewPage}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-200 rounded text-sm w-full text-left text-gray-500"
                >
                  <Icons.Plus className="w-4 h-4" />
                  <span>Agregar página</span>
                </button>
              </div>
            )}
          </div>

          {/* Templates */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Plantillas</h4>
            <div className="ml-2 space-y-1">
              {mockTemplates.map((template) => {
                const IconComponent = Icons[template.icon] || Icons.FileText;
                return (
                  <button
                    key={template.id}
                    className="flex items-center space-x-2 p-1 hover:bg-gray-200 rounded text-sm w-full text-left"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="truncate">{template.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Header Component
const Header = ({ onSidebarToggle, currentPage }) => {
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
          {currentPage && (
            <>
              <span className="text-sm text-gray-500">Mi Workspace</span>
              <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{currentPage.title}</span>
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
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">U</span>
        </div>
      </div>
    </header>
  );
};

// Page Editor Component
const PageEditor = ({ page, onUpdatePage }) => {
  const [content, setContent] = useState(page?.content || '');
  const [title, setTitle] = useState(page?.title || '');

  useEffect(() => {
    setContent(page?.content || '');
    setTitle(page?.title || '');
  }, [page]);

  const handleContentChange = (value) => {
    setContent(value);
    if (onUpdatePage) {
      onUpdatePage({ ...page, content: value });
    }
  };

  const handleTitleChange = (value) => {
    setTitle(value);
    if (onUpdatePage) {
      onUpdatePage({ ...page, title: value });
    }
  };

  if (!page) {
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

  if (page.type === 'database') {
    return <DatabaseView page={page} onUpdatePage={onUpdatePage} />;
  }

  return (
    <div className="flex-1 bg-white">
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

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bloques disponibles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: 'Type', label: 'Texto', desc: 'Párrafo simple' },
              { icon: 'Heading', label: 'Encabezado', desc: 'Título grande' },
              { icon: 'List', label: 'Lista', desc: 'Lista con viñetas' },
              { icon: 'CheckSquare', label: 'Lista tareas', desc: 'Lista con checkboxes' },
              { icon: 'Image', label: 'Imagen', desc: 'Subir imagen' },
              { icon: 'Link', label: 'Enlace', desc: 'Enlace a página web' },
              { icon: 'Quote', label: 'Cita', desc: 'Texto destacado' },
              { icon: 'Code', label: 'Código', desc: 'Bloque de código' }
            ].map((block) => {
              const IconComponent = Icons[block.icon] || Icons.Square;
              return (
                <button
                  key={block.label}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                >
                  <IconComponent className="w-5 h-5 text-gray-600 mb-2" />
                  <div className="text-sm font-medium text-gray-900">{block.label}</div>
                  <div className="text-xs text-gray-500">{block.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Database View Component
const DatabaseView = ({ page, onUpdatePage }) => {
  const [viewType, setViewType] = useState('table');
  const [data, setData] = useState(page?.data || []);

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
          {data.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  <Icons.FileText className="w-4 h-4 text-gray-400" />
                  <span>{item.title}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                  {item.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                  {item.priority}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{item.date}</td>
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
              {data.filter(item => item.status === status).length}
            </span>
          </h3>
          <div className="space-y-3">
            {data.filter(item => item.status === status).map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="font-medium text-gray-900 mb-2">{item.title}</div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                    {item.priority}
                  </span>
                  <span className="text-xs text-gray-500">{item.date}</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
          
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
          {viewType === 'table' ? <TableView /> : <KanbanView />}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(mockPages[0]);
  const [pages, setPages] = useState(mockPages);

  const handlePageSelect = (page) => {
    setCurrentPage(page);
  };

  const handleNewPage = () => {
    const newPage = {
      id: pages.length + 1,
      title: 'Nueva página',
      icon: 'FileText',
      type: 'page',
      content: ''
    };
    setPages([...pages, newPage]);
    setCurrentPage(newPage);
  };

  const handleUpdatePage = (updatedPage) => {
    setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p));
    setCurrentPage(updatedPage);
  };

  return (
    <div className="App h-screen flex flex-col bg-white">
      <Header 
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
          onNewPage={handleNewPage}
        />
        
        <PageEditor
          page={currentPage}
          onUpdatePage={handleUpdatePage}
        />
      </div>
    </div>
  );
}

export default App;