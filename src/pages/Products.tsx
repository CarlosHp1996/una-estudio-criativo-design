import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const categoryParam = searchParams.get("categoria") || "todos";
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "todos" ||
      selectedCategory === "Todos" ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "Todos" || category === "todos") {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: category.toLowerCase() });
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8 text-center">
          Nossos Produtos
        </h1>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory.toLowerCase() === category.toLowerCase() ? "default" : "outline"}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado com os filtros selecionados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
