import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestRoute } from "@/components/ProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/layouts/MainLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import AccountSettings from "./pages/AccountSettings";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Guest-only Routes (redirect if authenticated) */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/registro"
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                }
              />
              <Route
                path="/esqueci-senha"
                element={
                  <GuestRoute>
                    <ForgotPassword />
                  </GuestRoute>
                }
              />
              <Route
                path="/reset-senha"
                element={
                  <GuestRoute>
                    <ResetPassword />
                  </GuestRoute>
                }
              />

              {/* Main App Routes (with layout) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/produto/:id" element={<ProductDetail />} />
                <Route path="/carrinho" element={<Cart />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route path="/sobre" element={<About />} />
                <Route path="/contato" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Dashboard Routes (protected) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<UserDashboard />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="pedidos" element={<OrderHistory />} />
                <Route
                  path="favoritos"
                  element={
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Favoritos</h1>
                      <p>Em desenvolvimento...</p>
                    </div>
                  }
                />
                <Route
                  path="pagamentos"
                  element={
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Pagamentos</h1>
                      <p>Em desenvolvimento...</p>
                    </div>
                  }
                />
                <Route
                  path="notificacoes"
                  element={
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Notificações</h1>
                      <p>Em desenvolvimento...</p>
                    </div>
                  }
                />
                <Route path="seguranca" element={<AccountSettings />} />
                <Route
                  path="configuracoes"
                  element={
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Configurações</h1>
                      <p>Em desenvolvimento...</p>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
