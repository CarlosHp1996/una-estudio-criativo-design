import React, { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { AdminProductService } from "@/services/adminProductService";
import { Product, EnumCategory, CreateProductRequest } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";

interface ProductFormProps {
  product?: Product | null;
  categories?: EnumCategory[];
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState<
    CreateProductRequest & { inventory: { quantity: number; minStock: number } }
  >({
    name: "",
    description: "",
    price: 0,
    category: "",
    stockQuantity: 0,
    isActive: true,
    attributes: [],
    inventory: { quantity: 0, minStock: 0 },
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (product) {
      // Extrair categoria dos attributes se disponível
      let categoryValue = "";
      if (product.attributes?.[0]?.category !== undefined) {
        // A categoria do backend é um número (enum)
        const categoryNum = product.attributes[0].category;
        // Encontrar o nome do enum correspondente ao número
        // EnumCategory.Teste1 = 0, Teste2 = 1, Teste3 = 2
        if (categoryNum === EnumCategory.Teste1) categoryValue = "Teste1";
        else if (categoryNum === EnumCategory.Teste2) categoryValue = "Teste2";
        else if (categoryNum === EnumCategory.Teste3) categoryValue = "Teste3";
      }

      setFormData((prev) => ({
        ...prev,
        name: product.name,
        description: product.description,
        price: product.price,
        category: categoryValue,
        stockQuantity: product.stockQuantity,
        inventory: {
          quantity: product.stockQuantity,
          minStock: product.inventory?.minStock || 0,
        },
      }));

      // Usar imageUrl direto, não array de images
      if (product.imageUrl) {
        setPreviewImages([product.imageUrl]);
      }
    }
  }, [product]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInventoryChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      stockQuantity: value, // Sincronizar com stockQuantity
      inventory: {
        ...prev.inventory,
        [field]: value,
      },
    }));
  };

  const handleImageUpload = (files: FileList) => {
    if (files.length === 0) return;
    const file = files[0];
    setImageFile(file);
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImages([reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewImages([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória";
    }

    if (formData.price <= 0) {
      newErrors.price = "Preço deve ser maior que zero";
    }

    if (!formData.category) {
      newErrors.category = "Categoria é obrigatória";
    }

    if (formData.stockQuantity < 0) {
      newErrors.quantity = "Quantidade não pode ser negativa";
    }

    // Na criação, imagem é obrigatória
    if (!product && !imageFile) {
      newErrors.images = "Imagem é obrigatória ao criar produto";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("Name", formData.name);
      data.append("Description", formData.description);
      data.append("Price", String(formData.price));
      data.append("StockQuantity", String(formData.stockQuantity));
      data.append("IsActive", "true");

      // Adicionar InventoryId se existir no produto (para update)
      // O backend retorna inventoryId em alguns casos
      const inventoryId =
        (product as unknown as { inventoryId?: string })?.inventoryId || "";
      data.append("InventoryId", inventoryId);

      if (imageFile) {
        data.append("ImageUrl", imageFile);
      }

      // ✅ CORREÇÃO: Envia Attributes usando a convenção de índices do ASP.NET Core
      if (formData.category) {
        // Converte o nome do enum (string) para seu valor numérico
        const categoryValue =
          typeof formData.category === "string"
            ? EnumCategory[formData.category as keyof typeof EnumCategory]
            : formData.category;

        // Envia usando a nomenclatura correta para model binding
        data.append("Attributes[0].Category", String(categoryValue));
      }

      if (product) {
        await AdminProductService.updateProduct(product.id, data);
        toast.success("Produto atualizado com sucesso");
      } else {
        await AdminProductService.createProduct(data);
        toast.success("Produto criado com sucesso");
      }
      onSave();
    } catch (error: unknown) {
      console.error("Failed to save product:", error);
      const errorMessage = parseApiError(error as AxiosError).message;
      toast.error(`Erro ao salvar produto: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Digite o nome do produto"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Descreva o produto em detalhes"
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    handleInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-sm text-red-600 mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger
                    className={errors.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EnumCategory)
                      .filter(([k, v]) => isNaN(Number(k)))
                      .map(([key, _]) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Controle de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantidade em Estoque</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.inventory.quantity}
                onChange={(e) =>
                  handleInventoryChange(
                    "quantity",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Status atual:</strong>{" "}
                {formData.inventory.quantity === 0
                  ? "Sem estoque"
                  : "Em estoque"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Imagens do Produto *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files && handleImageUpload(e.target.files)
                }
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="space-y-2">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  )}
                  <p className="text-gray-600">
                    {uploading
                      ? "Fazendo upload..."
                      : "Clique para fazer upload ou arraste as imagens"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 10MB cada
                  </p>
                </div>
              </label>
            </div>

            {errors.images && (
              <p className="text-sm text-red-600">{errors.images}</p>
            )}

            {/* Image Preview */}
            {previewImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Imagem selecionada</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative group">
                    <img
                      src={previewImages[0]}
                      alt="Produto"
                      className="w-full h-32 object-cover rounded-lg bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <Badge className="absolute bottom-1 left-1 bg-green-600">
                      Principal
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {product ? "Atualizar" : "Criar"} Produto
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
