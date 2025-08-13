import { BrowserRouter, Routes, Route } from "react-router-dom";
import Planner from "./pages/Planner";
import SavedRoutes from "./pages/SavedRoutes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import { AuthProvider } from "./state/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/plan" element={<Planner />} />
          <Route path="/saved" element={<SavedRoutes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
