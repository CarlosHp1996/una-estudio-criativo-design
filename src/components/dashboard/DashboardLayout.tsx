import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { DashboardNavigation } from "./DashboardNavigation";

interface DashboardLayoutProps {
  children?: ReactNode;
}

/**
 * Layout principal para as páginas do dashboard do usuário
 * Inclui navegação lateral e área de conteúdo responsiva
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navegação Lateral */}
          <aside className="lg:w-64 w-full">
            <div className="bg-white rounded-lg shadow-sm border p-4 lg:sticky lg:top-6">
              <DashboardNavigation />
            </div>
          </aside>

          {/* Área Principal de Conteúdo */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
