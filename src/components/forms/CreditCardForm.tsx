import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import { CardDetails } from "@/types/api";

interface CreditCardFormProps {
  onSubmit: (cardDetails: CardDetails) => void;
  onCancel: () => void;
  isLoading?: boolean;
  amount?: number;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  amount,
}) => {
  const [formData, setFormData] = useState<CardDetails>({
    number: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    holderName: "",
  });

  const [errors, setErrors] = useState<Partial<CardDetails>>({});
  const [cardType, setCardType] = useState<string>("unknown");

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const formattedValue = cleanValue.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formattedValue.substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date as MM/YY
  const formatExpiry = (value: string, field: "expiryMonth" | "expiryYear") => {
    const cleanValue = value.replace(/\D/g, "");
    if (field === "expiryMonth") {
      return cleanValue.substring(0, 2);
    }
    return cleanValue.substring(0, 2);
  };

  // Format CVV
  const formatCVV = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const maxLength = cardType === "amex" ? 4 : 3;
    return cleanValue.substring(0, maxLength);
  };

  // Validate individual fields
  const validateField = (
    field: keyof CardDetails,
    value: string
  ): string | null => {
    switch (field) {
      case "number":
        const cleanNumber = value.replace(/\D/g, "");
        if (!cleanNumber) return "Número do cartão é obrigatório";
        if (cleanNumber.length < 13)
          return "Número do cartão deve ter pelo menos 13 dígitos";
        if (!PaymentService.validateCardNumber(cleanNumber))
          return "Número do cartão inválido";
        return null;

      case "expiryMonth":
        if (!value) return "Mês é obrigatório";
        const month = parseInt(value);
        if (month < 1 || month > 12) return "Mês inválido";
        return null;

      case "expiryYear":
        if (!value) return "Ano é obrigatório";
        if (!PaymentService.validateExpiryDate(formData.expiryMonth, value)) {
          return "Data de validade expirada";
        }
        return null;

      case "cvv":
        if (!value) return "CVV é obrigatório";
        if (!PaymentService.validateCVV(value, cardType)) {
          return `CVV deve ter ${cardType === "amex" ? "4" : "3"} dígitos`;
        }
        return null;

      case "holderName":
        if (!value.trim()) return "Nome do portador é obrigatório";
        if (value.trim().length < 3)
          return "Nome deve ter pelo menos 3 caracteres";
        return null;

      default:
        return null;
    }
  };

  // Handle input changes
  const handleChange = (field: keyof CardDetails, value: string) => {
    let formattedValue = value;

    // Apply formatting
    switch (field) {
      case "number":
        formattedValue = formatCardNumber(value);
        // Update card type when number changes
        const cleanNumber = value.replace(/\D/g, "");
        setCardType(PaymentService.getCardType(cleanNumber));
        break;
      case "expiryMonth":
      case "expiryYear":
        formattedValue = formatExpiry(value, field);
        break;
      case "cvv":
        formattedValue = formatCVV(value);
        break;
      case "holderName":
        formattedValue = value.toUpperCase();
        break;
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Partial<CardDetails> = {};

    Object.keys(formData).forEach((key) => {
      const field = key as keyof CardDetails;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Clean data before submission
      const cleanData: CardDetails = {
        ...formData,
        number: formData.number.replace(/\D/g, ""),
        holderName: formData.holderName.trim(),
      };

      onSubmit(cleanData);
    }
  };

  // Get card type icon
  const getCardIcon = () => {
    switch (cardType) {
      case "visa":
        return "💳"; // In a real app, use proper icons
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      default:
        return "💳";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Informações do Cartão
        </CardTitle>
        {amount && (
          <div className="text-sm text-muted-foreground">
            Valor: R${" "}
            {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formData.number}
                onChange={(e) => handleChange("number", e.target.value)}
                className={errors.number ? "border-red-500" : ""}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-lg">{getCardIcon()}</span>
              </div>
            </div>
            {errors.number && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.number}
              </div>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="holderName">Nome do Portador</Label>
            <Input
              id="holderName"
              type="text"
              placeholder="JOÃO DA SILVA"
              value={formData.holderName}
              onChange={(e) => handleChange("holderName", e.target.value)}
              className={errors.holderName ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.holderName && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.holderName}
              </div>
            )}
          </div>

          {/* Expiry Date and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="expiryMonth">Mês</Label>
              <Input
                id="expiryMonth"
                type="text"
                placeholder="12"
                value={formData.expiryMonth}
                onChange={(e) => handleChange("expiryMonth", e.target.value)}
                className={errors.expiryMonth ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.expiryMonth && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.expiryMonth}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="expiryYear">Ano</Label>
              <Input
                id="expiryYear"
                type="text"
                placeholder="28"
                value={formData.expiryYear}
                onChange={(e) => handleChange("expiryYear", e.target.value)}
                className={errors.expiryYear ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.expiryYear && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.expiryYear}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                placeholder={cardType === "amex" ? "1234" : "123"}
                value={formData.cvv}
                onChange={(e) => handleChange("cvv", e.target.value)}
                className={errors.cvv ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.cvv && (
                <div className="text-xs text-red-600 mt-1">{errors.cvv}</div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Suas informações de pagamento são protegidas por criptografia SSL.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processando...
                </>
              ) : (
                "Pagar Agora"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreditCardForm;
