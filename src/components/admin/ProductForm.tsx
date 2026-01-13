import React, { useState, useEffect } from "react";
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
import { Product, Category, CreateProductRequest } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: "",
    description: "",
    price: 0,
    category: "",
    tags: [],
    images: [],
    inventory: {
      quantity: 0,
      minStock: 5,
    },
  });

  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        tags: product.tags,
        images: product.images,
        inventory: {
          quantity: product.inventory.quantity,
          minStock: product.inventory.minStock,
        },
      });
      setPreviewImages(product.images);
    }
  }, [product]);

  const handleInputChange = (field: string, value: any) => {
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
      inventory: {
        ...prev.inventory,
        [field]: value,
      },
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = await AdminProductService.uploadImages(files);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      // Update preview images
      setPreviewImages((prev) => [...prev, ...uploadedUrls]);

      toast.success(
        `${uploadedUrls.length} imagem(ns) carregada(s) com sucesso`
      );
    } catch (error: any) {
      console.error("Failed to upload images:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao fazer upload: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((url) => url !== imageUrl),
    }));
    setPreviewImages((prev) => prev.filter((url) => url !== imageUrl));
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

    if (formData.inventory.quantity < 0) {
      newErrors.quantity = "Quantidade não pode ser negativa";
    }

    if (formData.inventory.minStock < 0) {
      newErrors.minStock = "Estoque mínimo não pode ser negativo";
    }

    if (formData.images.length === 0) {
      newErrors.images = "Pelo menos uma imagem é obrigatória";
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
      if (product) {
        await AdminProductService.updateProduct(product.id, formData);
        toast.success("Produto atualizado com sucesso");
      } else {
        await AdminProductService.createProduct(formData);
        toast.success("Produto criado com sucesso");
      }
      onSave();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      const errorMessage = parseApiError(error).message;
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
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
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
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.inventory.minStock}
                onChange={(e) =>
                  handleInventoryChange(
                    "minStock",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
                className={errors.minStock ? "border-red-500" : ""}
              />
              <p className="text-xs text-gray-500 mt-1">
                Alerta será exibido quando o estoque atingir este valor
              </p>
              {errors.minStock && (
                <p className="text-sm text-red-600 mt-1">{errors.minStock}</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Status atual:</strong>{" "}
                {formData.inventory.quantity === 0
                  ? "Sem estoque"
                  : formData.inventory.quantity <= formData.inventory.minStock
                  ? "Estoque baixo"
                  : "Em estoque"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Digite uma tag e pressione Enter"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-600"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
              {formData.tags.length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma tag adicionada</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                multiple
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
                <h4 className="text-sm font-medium mb-3">
                  Imagens ({previewImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Produto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg bg-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imageUrl)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 bg-green-600">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
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
