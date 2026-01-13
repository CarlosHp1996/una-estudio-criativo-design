import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Settings,
  Mail,
  Shield,
  CreditCard,
  Truck,
  Store,
  Bell,
  Database,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  general: {
    storeName: string;
    storeDescription: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
    currency: string;
    timezone: string;
  };
  email: {
    smtpEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
  };
  payment: {
    stripeEnabled: boolean;
    stripePublicKey: string;
    stripeSecretKey: string;
    paypalEnabled: boolean;
    paypalClientId: string;
    paypalClientSecret: string;
    pixEnabled: boolean;
    pixKey: string;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    estimatedDeliveryDays: number;
    shippingZones: string[];
  };
  security: {
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    orderNotifications: boolean;
    inventoryAlerts: boolean;
  };
  maintenance: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    backupEnabled: boolean;
    backupFrequency: string;
  };
}

const defaultSettings: SystemSettings = {
  general: {
    storeName: "Una Estúdio Criativo",
    storeDescription: "Loja de produtos criativos e únicos",
    storeEmail: "contato@unaestudio.com",
    storePhone: "(11) 99999-9999",
    storeAddress: "São Paulo, SP",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
  },
  email: {
    smtpEnabled: false,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    fromEmail: "noreply@unaestudio.com",
    fromName: "Una Estúdio Criativo",
  },
  payment: {
    stripeEnabled: true,
    stripePublicKey: "",
    stripeSecretKey: "",
    paypalEnabled: false,
    paypalClientId: "",
    paypalClientSecret: "",
    pixEnabled: true,
    pixKey: "",
  },
  shipping: {
    freeShippingThreshold: 100,
    defaultShippingCost: 15,
    estimatedDeliveryDays: 7,
    shippingZones: ["São Paulo", "Rio de Janeiro", "Minas Gerais"],
  },
  security: {
    requireEmailVerification: true,
    enableTwoFactor: false,
    passwordMinLength: 8,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    inventoryAlerts: true,
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: "Sistema em manutenção. Voltamos em breve.",
    backupEnabled: true,
    backupFrequency: "daily",
  },
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from API
      // For now, use default settings
      setSettings(defaultSettings);
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // In a real app, this would save to API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    toast.info("Configurações resetadas para valores padrão");
  };

  const updateSetting = (
    section: keyof SystemSettings,
    field: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const tabs = [
    { id: "general", label: "Geral", icon: Store },
    { id: "email", label: "E-mail", icon: Mail },
    { id: "payment", label: "Pagamentos", icon: CreditCard },
    { id: "shipping", label: "Entrega", icon: Truck },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "maintenance", label: "Manutenção", icon: Database },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configurações do Sistema
          </h1>
          <p className="text-gray-600">
            Gerencie as configurações gerais da loja
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleResetSettings} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Seções
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Nome da Loja</Label>
                    <Input
                      id="storeName"
                      value={settings.general.storeName}
                      onChange={(e) =>
                        updateSetting("general", "storeName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeEmail">E-mail da Loja</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={settings.general.storeEmail}
                      onChange={(e) =>
                        updateSetting("general", "storeEmail", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="storePhone">Telefone</Label>
                    <Input
                      id="storePhone"
                      value={settings.general.storePhone}
                      onChange={(e) =>
                        updateSetting("general", "storePhone", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Moeda</Label>
                    <Select
                      value={settings.general.currency}
                      onValueChange={(value) =>
                        updateSetting("general", "currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (BRL)</SelectItem>
                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="storeDescription">Descrição da Loja</Label>
                  <Textarea
                    id="storeDescription"
                    value={settings.general.storeDescription}
                    onChange={(e) =>
                      updateSetting(
                        "general",
                        "storeDescription",
                        e.target.value
                      )
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="storeAddress">Endereço</Label>
                  <Input
                    id="storeAddress"
                    value={settings.general.storeAddress}
                    onChange={(e) =>
                      updateSetting("general", "storeAddress", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Settings */}
          {activeTab === "email" && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de E-mail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.email.smtpEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("email", "smtpEnabled", checked)
                    }
                  />
                  <Label>Habilitar SMTP</Label>
                </div>

                {settings.email.smtpEnabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">Servidor SMTP</Label>
                        <Input
                          id="smtpHost"
                          value={settings.email.smtpHost}
                          onChange={(e) =>
                            updateSetting("email", "smtpHost", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">Porta</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) =>
                            updateSetting(
                              "email",
                              "smtpPort",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpUser">Usuário</Label>
                        <Input
                          id="smtpUser"
                          value={settings.email.smtpUser}
                          onChange={(e) =>
                            updateSetting("email", "smtpUser", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPassword">Senha</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          value={settings.email.smtpPassword}
                          onChange={(e) =>
                            updateSetting(
                              "email",
                              "smtpPassword",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="fromEmail">E-mail de Envio</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) =>
                            updateSetting("email", "fromEmail", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="fromName">Nome do Remetente</Label>
                        <Input
                          id="fromName"
                          value={settings.email.fromName}
                          onChange={(e) =>
                            updateSetting("email", "fromName", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.email.smtpSecure}
                        onCheckedChange={(checked) =>
                          updateSetting("email", "smtpSecure", checked)
                        }
                      />
                      <Label>Conexão Segura (TLS/SSL)</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stripe */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={settings.payment.stripeEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("payment", "stripeEnabled", checked)
                      }
                    />
                    <Label className="text-lg">Stripe</Label>
                  </div>

                  {settings.payment.stripeEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stripePublicKey">Chave Pública</Label>
                        <Input
                          id="stripePublicKey"
                          value={settings.payment.stripePublicKey}
                          onChange={(e) =>
                            updateSetting(
                              "payment",
                              "stripePublicKey",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="stripeSecretKey">Chave Secreta</Label>
                        <Input
                          id="stripeSecretKey"
                          type="password"
                          value={settings.payment.stripeSecretKey}
                          onChange={(e) =>
                            updateSetting(
                              "payment",
                              "stripeSecretKey",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* PayPal */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={settings.payment.paypalEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("payment", "paypalEnabled", checked)
                      }
                    />
                    <Label className="text-lg">PayPal</Label>
                  </div>

                  {settings.payment.paypalEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paypalClientId">Client ID</Label>
                        <Input
                          id="paypalClientId"
                          value={settings.payment.paypalClientId}
                          onChange={(e) =>
                            updateSetting(
                              "payment",
                              "paypalClientId",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="paypalClientSecret">
                          Client Secret
                        </Label>
                        <Input
                          id="paypalClientSecret"
                          type="password"
                          value={settings.payment.paypalClientSecret}
                          onChange={(e) =>
                            updateSetting(
                              "payment",
                              "paypalClientSecret",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* PIX */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={settings.payment.pixEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("payment", "pixEnabled", checked)
                      }
                    />
                    <Label className="text-lg">PIX</Label>
                  </div>

                  {settings.payment.pixEnabled && (
                    <div>
                      <Label htmlFor="pixKey">Chave PIX</Label>
                      <Input
                        id="pixKey"
                        value={settings.payment.pixKey}
                        onChange={(e) =>
                          updateSetting("payment", "pixKey", e.target.value)
                        }
                        placeholder="E-mail, telefone, CPF ou chave aleatória"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.security.requireEmailVerification}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "security",
                            "requireEmailVerification",
                            checked
                          )
                        }
                      />
                      <Label>Verificação de E-mail Obrigatória</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.security.enableTwoFactor}
                        onCheckedChange={(checked) =>
                          updateSetting("security", "enableTwoFactor", checked)
                        }
                      />
                      <Label>Autenticação de Dois Fatores</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="passwordMinLength">
                        Tamanho Mínimo da Senha
                      </Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        min="6"
                        max="50"
                        value={settings.security.passwordMinLength}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "passwordMinLength",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="sessionTimeout">
                        Timeout de Sessão (horas)
                      </Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="1"
                        max="168"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "sessionTimeout",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxLoginAttempts">
                        Máximo de Tentativas de Login
                      </Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "maxLoginAttempts",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance Settings */}
          {activeTab === "maintenance" && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Manutenção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.maintenance.maintenanceMode}
                    onCheckedChange={(checked) =>
                      updateSetting("maintenance", "maintenanceMode", checked)
                    }
                  />
                  <Label>Modo de Manutenção</Label>
                </div>

                <div>
                  <Label htmlFor="maintenanceMessage">
                    Mensagem de Manutenção
                  </Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenance.maintenanceMessage}
                    onChange={(e) =>
                      updateSetting(
                        "maintenance",
                        "maintenanceMessage",
                        e.target.value
                      )
                    }
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.maintenance.backupEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("maintenance", "backupEnabled", checked)
                    }
                  />
                  <Label>Backup Automático</Label>
                </div>

                {settings.maintenance.backupEnabled && (
                  <div>
                    <Label htmlFor="backupFrequency">
                      Frequência de Backup
                    </Label>
                    <Select
                      value={settings.maintenance.backupFrequency}
                      onValueChange={(value) =>
                        updateSetting("maintenance", "backupFrequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
