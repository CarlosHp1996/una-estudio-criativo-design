import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  NotificationProvider,
  NotificationContainer,
} from "@/contexts/NotificationContext";
import { GuestRoute } from "@/components/ProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { Spinner } from "@/components/ui/spinner";

// Lazy load pages for better performance
const MainLayout = lazy(() => import("./layouts/MainLayout"));
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const DashboardLayout = lazy(
  () => import("./components/dashboard/DashboardLayout")
);
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  }))
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  }))
);
const AdminProductsPage = lazy(() =>
  import("./pages/admin/AdminProductsPage").then((module) => ({
    default: module.AdminProductsPage,
  }))
);
const AdminOrdersPage = lazy(() =>
  import("./pages/admin/AdminOrdersPage").then((module) => ({
    default: module.AdminOrdersPage,
  }))
);
const AdminOrderDetailPage = lazy(() =>
  import("./pages/admin/AdminOrderDetailPage").then((module) => ({
    default: module.AdminOrderDetailPage,
  }))
);
const AdminReportsPage = lazy(() =>
  import("./pages/admin/AdminReportsPage").then((module) => ({
    default: module.AdminReportsPage,
  }))
);
const AdminAuditPage = lazy(() =>
  import("./pages/admin/AdminAuditPage").then((module) => ({
    default: module.AdminAuditPage,
  }))
);
const AdminSettingsPage = lazy(() =>
  import("./pages/admin/AdminSettingsPage").then((module) => ({
    default: module.AdminSettingsPage,
  }))
);
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

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
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <NotificationContainer />
                <BrowserRouter>
                  <Suspense fallback={<LoadingFallback />}>
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
                        <Route
                          path="/produto/:id"
                          element={<ProductDetail />}
                        />
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
                        <Route
                          path="/rastreamento"
                          element={<TrackingPage />}
                        />
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
                          path="pedidos/:orderId"
                          element={<OrderDetail />}
                        />
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
                              <h1 className="text-2xl font-bold">
                                Notificações
                              </h1>
                              <p>Em desenvolvimento...</p>
                            </div>
                          }
                        />
                        <Route path="seguranca" element={<AccountSettings />} />
                        <Route
                          path="configuracoes"
                          element={
                            <div className="p-6">
                              <h1 className="text-2xl font-bold">
                                Configurações
                              </h1>
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
                        <Route
                          path="products"
                          element={<AdminProductsPage />}
                        />
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
                        <Route
                          path="settings"
                          element={<AdminSettingsPage />}
                        />
                      </Route>
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
