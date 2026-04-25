import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BandaProvider } from "./context/BandaContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Banda from "./pages/Banda";
import Eventos from "./pages/Eventos";
import Finanzas from "./pages/Finanzas";
import Notas from "./pages/Notas";
import Repertorio from "./pages/Repertorio";
import PerfilPublico from "./pages/PerfilPublico";
import { estaAutenticado } from "./api/auth";

function PrivateRoute({ children }) {
  return estaAutenticado() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/publico/:url" element={<PerfilPublico />} />

        <Route
          element={
            <PrivateRoute>
              <BandaProvider>
                <Layout />
              </BandaProvider>
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/banda" element={<Banda />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/repertorio" element={<Repertorio />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
