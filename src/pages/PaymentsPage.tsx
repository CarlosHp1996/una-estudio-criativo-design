import PaymentHistory from "@/components/PaymentHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentsPage = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Meus Pagamentos</CardTitle>
              <p className="text-muted-foreground">
                Gerencie e acompanhe todos os seus pagamentos
              </p>
            </CardHeader>
            <CardContent>
              <PaymentHistory />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
