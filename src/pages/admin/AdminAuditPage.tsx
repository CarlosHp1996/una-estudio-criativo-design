import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  User,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

interface AuditLogsResponse {
  items: AuditLog[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const pageSize = 20;

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, actionFilter, entityFilter, dateFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      // Mock data for demo - in real app, this would call an API
      const mockLogs: AuditLog[] = [
        {
          id: "audit_1",
          timestamp: new Date().toISOString(),
          userId: "admin_1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          action: "CREATE_PRODUCT",
          entityType: "Product",
          entityId: "prod_123",
          oldData: null,
          newData: { name: "Novo Produto", price: 99.99 },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          success: true,
        },
        {
          id: "audit_2",
          timestamp: new Date(Date.now() - 60000).toISOString(),
          userId: "admin_1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          action: "UPDATE_ORDER_STATUS",
          entityType: "Order",
          entityId: "ord_456",
          oldData: { status: "pending" },
          newData: { status: "processing" },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          success: true,
        },
        {
          id: "audit_3",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          userId: "admin_2",
          userName: "Another Admin",
          userEmail: "admin2@example.com",
          action: "DELETE_PRODUCT",
          entityType: "Product",
          entityId: "prod_789",
          oldData: { name: "Produto Removido", price: 49.99 },
          newData: null,
          ipAddress: "192.168.1.2",
          userAgent: "Mozilla/5.0...",
          success: true,
        },
        {
          id: "audit_4",
          timestamp: new Date(Date.now() - 180000).toISOString(),
          userId: "user_1",
          userName: "Regular User",
          userEmail: "user@example.com",
          action: "LOGIN_ATTEMPT",
          entityType: "User",
          entityId: "user_1",
          oldData: null,
          newData: { loginTime: new Date().toISOString() },
          ipAddress: "192.168.1.10",
          userAgent: "Mozilla/5.0...",
          success: false,
          errorMessage: "Invalid credentials",
        },
        {
          id: "audit_5",
          timestamp: new Date(Date.now() - 240000).toISOString(),
          userId: "admin_1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          action: "BULK_UPDATE_ORDERS",
          entityType: "Order",
          oldData: null,
          newData: { orderIds: ["ord_1", "ord_2", "ord_3"], status: "shipped" },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          success: true,
        },
      ];

      // Apply filters
      let filteredLogs = mockLogs;

      if (searchTerm) {
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entityType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (actionFilter !== "all") {
        filteredLogs = filteredLogs.filter((log) =>
          log.action.includes(actionFilter.toUpperCase())
        );
      }

      if (entityFilter !== "all") {
        filteredLogs = filteredLogs.filter(
          (log) => log.entityType.toLowerCase() === entityFilter
        );
      }

      setAuditLogs(filteredLogs);
      setTotalItems(filteredLogs.length);
      setTotalPages(Math.ceil(filteredLogs.length / pageSize));
    } catch (error: any) {
      console.error("Failed to load audit logs:", error);
      toast.error("Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAuditLogs();
  };

  const handleExportLogs = async (format: "csv" | "excel") => {
    try {
      toast.success(`Exportando logs em formato ${format.toUpperCase()}...`);
      // In real app, would call API to export logs
    } catch (error: any) {
      console.error("Failed to export logs:", error);
      toast.error("Erro ao exportar logs");
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.split("_")[0]) {
      case "CREATE":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Criar
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Atualizar
          </Badge>
        );
      case "DELETE":
        return <Badge variant="destructive">Excluir</Badge>;
      case "LOGIN":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Login
          </Badge>
        );
      case "BULK":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Lote
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "product":
        return "📦";
      case "order":
        return "🛒";
      case "user":
        return "👤";
      case "admin":
        return "🔑";
      default:
        return "📄";
    }
  };

  const formatActionText = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Auditoria do Sistema
          </h1>
          <p className="text-gray-600">{totalItems} evento(s) registrado(s)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExportLogs("csv")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleExportLogs("excel")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por usuário, ação, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="create">Criar</SelectItem>
                    <SelectItem value="update">Atualizar</SelectItem>
                    <SelectItem value="delete">Excluir</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="bulk">Operações em lote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as entidades</SelectItem>
                    <SelectItem value="product">Produtos</SelectItem>
                    <SelectItem value="order">Pedidos</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="outline" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-600">
                            Nenhum log de auditoria encontrado
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {new Date(log.timestamp).toLocaleDateString(
                                "pt-BR"
                              )}
                            </div>
                            <div className="text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString(
                                "pt-BR"
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.userName}</p>
                            <p className="text-sm text-gray-500">
                              {log.userEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionBadge(log.action)}
                            <span className="text-sm">
                              {formatActionText(log.action)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getEntityIcon(log.entityType)}</span>
                            <span>{log.entityType}</span>
                            {log.entityId && (
                              <span className="text-xs text-gray-500">
                                #{log.entityId.slice(-6)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              Sucesso
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Falha</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {log.ipAddress}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationPrevious
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      {currentPage < totalPages && (
                        <PaginationNext
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Card className="fixed inset-0 z-50 bg-white m-4 overflow-auto">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes do Log de Auditoria
              </CardTitle>
              <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Informações Gerais</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">ID do Log:</span>
                    <p className="font-mono">{selectedLog.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Timestamp:</span>
                    <p>
                      {new Date(selectedLog.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Usuário:</span>
                    <p>
                      {selectedLog.userName} ({selectedLog.userEmail})
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Ação:</span>
                    <p>{formatActionText(selectedLog.action)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Entidade:</span>
                    <p>
                      {selectedLog.entityType}{" "}
                      {selectedLog.entityId && `(${selectedLog.entityId})`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Informações Técnicas</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Endereço IP:</span>
                    <p className="font-mono">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">User Agent:</span>
                    <p className="text-sm break-all">{selectedLog.userAgent}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <p>
                      {selectedLog.success ? (
                        <span className="text-green-600">Sucesso</span>
                      ) : (
                        <span className="text-red-600">Falha</span>
                      )}
                    </p>
                  </div>
                  {selectedLog.errorMessage && (
                    <div>
                      <span className="text-sm text-gray-500">Erro:</span>
                      <p className="text-red-600">{selectedLog.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Data Changes */}
            {(selectedLog.oldData || selectedLog.newData) && (
              <div>
                <h3 className="font-semibold mb-3">Alterações nos Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.oldData && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Dados Anteriores:
                      </span>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newData && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Novos Dados:
                      </span>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
