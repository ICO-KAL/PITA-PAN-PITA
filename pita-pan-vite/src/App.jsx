import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import EmployeeLogin from './pages/EmployeeLogin'
import EmployeeRegister from './pages/EmployeeRegister'
import TrackOrder from './pages/TrackOrder'
import ClientLayout from './pages/client/ClientLayout'
import ClientMenu from './pages/client/ClientMenu'
import ClientOrderDetails from './pages/client/ClientOrderDetails'
import ClientNotifications from './pages/client/ClientNotifications'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />
  <Route path="/employee-register" element={<EmployeeRegister />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/carta" element={<Menu />} />
      <Route path="/track-order/:id" element={<TrackOrder />} />
      {/* Área del cliente */}
      <Route
        path="/cliente"
        element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientMenu />} />
        <Route path="menu" element={<ClientMenu />} />
        <Route path="detalles" element={<ClientOrderDetails />} />
        <Route path="notificaciones" element={<ClientNotifications />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Rutas antiguas deshabilitadas: unificamos todo en /dashboard para ADMIN/CAJERO/COCINERO */}
    </Routes>
  )
}

export default App
