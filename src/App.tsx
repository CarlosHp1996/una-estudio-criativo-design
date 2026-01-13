import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestRoute } from "@/components/ProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import OrderDetail from "./pages/OrderDetail";
import AccountSettings from "./pages/AccountSettings";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import TrackingPage from "./pages/TrackingPage";
import AdminRoute from "./components/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminAuditPage } from "./pages/admin/AdminAuditPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleOAuthProvider
          clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || ""}
        >
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
                    <Route path="/rastreamento" element={<TrackingPage />} />
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
                    <Route path="pedidos/:orderId" element={<OrderDetail />} />
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

                  {/* Admin Routes (protected) */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route
                      path="orders/:orderId"
                      element={<AdminOrderDetailPage />}
                    />
                    <Route
                      path="customers"
                      element={
                        <div className="p-6">
                          <h1 className="text-2xl font-bold">
                            Gestão de Clientes
                          </h1>
                          <p>Em desenvolvimento...</p>
                        </div>
                      }
                    />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="audit" element={<AdminAuditPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
