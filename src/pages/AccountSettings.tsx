import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save, Loader2, Eye, EyeOff } from "lucide-react";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .regex(/(?=.*[a-z])/, "Deve conter pelo menos uma letra minúscula")
      .regex(/(?=.*[A-Z])/, "Deve conter pelo menos uma letra maiúscula")
      .regex(/(?=.*\d)/, "Deve conter pelo menos um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function AccountSettings() {
  const { user, changePassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Configurações de notificação (mock data)
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPromotions: true,
    emailNews: false,
    pushOrders: true,
    pushPromotions: false,
    smsOrders: false,
  });

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmitPassword(data: ChangePasswordFormValues) {
    try {
      setIsLoading(true);
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmPassword,
      });

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          "Não foi possível alterar a senha. Verifique sua senha atual.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleNotificationChange = (
    key: keyof typeof notifications,
    value: boolean
  ) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    // Aqui salvaria na API
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências de notificação foram salvas.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Configurações de Segurança
        </h1>
        <p className="text-gray-600">
          Gerencie sua senha e configurações de privacidade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alteração de Senha */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle>Alterar Senha</CardTitle>
            </div>
            <CardDescription>
              Mantenha sua conta segura com uma senha forte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitPassword)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha atual</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.current ? "text" : "password"}
                            placeholder="Digite sua senha atual"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                current: !prev.current,
                              }))
                            }
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.new ? "text" : "password"}
                            placeholder="Digite sua nova senha"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                new: !prev.new,
                              }))
                            }
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Mínimo 8 caracteres com maiúsculas, minúsculas e números
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.confirm ? "text" : "password"}
                            placeholder="Confirme sua nova senha"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                confirm: !prev.confirm,
                              }))
                            }
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Alterar senha
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Configurações de Notificação */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configure como você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Email</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      Pedidos e entregas
                    </label>
                    <p className="text-xs text-gray-500">
                      Receba atualizações sobre seus pedidos
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOrders}
                    onCheckedChange={(value) =>
                      handleNotificationChange("emailOrders", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Promoções</label>
                    <p className="text-xs text-gray-500">
                      Ofertas especiais e descontos
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailPromotions}
                    onCheckedChange={(value) =>
                      handleNotificationChange("emailPromotions", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Newsletter</label>
                    <p className="text-xs text-gray-500">
                      Novidades e tendências
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNews}
                    onCheckedChange={(value) =>
                      handleNotificationChange("emailNews", value)
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">Push Notifications</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Pedidos</label>
                    <p className="text-xs text-gray-500">
                      Status dos seus pedidos
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushOrders}
                    onCheckedChange={(value) =>
                      handleNotificationChange("pushOrders", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Promoções</label>
                    <p className="text-xs text-gray-500">Ofertas limitadas</p>
                  </div>
                  <Switch
                    checked={notifications.pushPromotions}
                    onCheckedChange={(value) =>
                      handleNotificationChange("pushPromotions", value)
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">SMS</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      Pedidos urgentes
                    </label>
                    <p className="text-xs text-gray-500">
                      Apenas atualizações importantes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsOrders}
                    onCheckedChange={(value) =>
                      handleNotificationChange("smsOrders", value)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>Dados sobre sua conta e atividade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Email da conta</h4>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Membro desde</h4>
              <p className="text-sm text-gray-600">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                  : "Dezembro 2024"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Último acesso</h4>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString("pt-BR")} às{" "}
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Status da conta</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ativa
              </span>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Zona de Perigo</h4>
            <p className="text-sm text-gray-600">
              Essas ações são irreversíveis. Tenha certeza antes de prosseguir.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm">
                Baixar meus dados
              </Button>
              <Button variant="destructive" size="sm">
                Excluir conta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountSettings;
