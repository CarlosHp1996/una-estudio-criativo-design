import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductCard from "@/components/ProductCard";
import { Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import aboutStudio from "@/assets/about-studio.jpg";
import ProductService from "@/services/productService";
import type { Product } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const response = await ProductService.getProducts(1, 3);
        const products = response.value?.products || [];
        console.log("Featured products loaded:", products);
        setFeaturedProducts(products);
      } catch (error) {
        console.error("Failed to load featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        id="inicio"
        className="relative h-[600px] flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/40"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">
            Arte feita à mão com amor
          </h1>
          <p className="text-xl text-foreground/90 mb-8">
            Peças únicas e exclusivas para transformar seus ambientes
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 button-pulse hover-lift transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Link to="/produtos">Ver Coleção</Link>
          </Button>
        </div>
      </section>

      {/* Featured Products */}
      <section id="produtos" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Produtos em Destaque
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubra nossas criações mais especiais, cada uma pintada à mão com
            dedicação e carinho
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
        <div className="text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="hover-lift transition-all duration-300 hover:scale-105"
          >
            <Link to="/produtos">Ver Todos os Produtos</Link>
          </Button>
        </div>
      </section>

      {/* Collections */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Nossas Coleções
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore nossas categorias de produtos artesanais
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {["Placas", "Pratos", "Copos", "Personalizados"].map(
              (category, index) => (
                <Link
                  key={category}
                  to={`/produtos?categoria=${category.toLowerCase()}`}
                  className="group hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="overflow-hidden hover:shadow-elegant transition-all duration-500 hover:scale-105 animate-fade-in">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-all duration-300">
                        {category}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src={aboutStudio}
              alt="Estúdio UNA"
              className="rounded-lg shadow-elegant w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              Sobre o Estúdio
            </h2>
            <p className="text-muted-foreground mb-4">
              No UNA Estudio Criativo, cada peça é criada com amor e dedicação.
              Acreditamos que a arte feita à mão traz um toque especial e único
              para sua casa.
            </p>
            <p className="text-muted-foreground mb-6">
              Trabalhamos com pintura em madeira, cerâmica e vidro, sempre
              buscando transmitir delicadeza e elegância em cada traço.
            </p>
            <Button
              asChild
              variant="outline"
              className="hover-lift transition-all duration-300 hover:scale-105"
            >
              <Link to="/sobre">Conheça Nossa História</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              O Que Dizem Nossos Clientes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Silva",
                text: "As peças são simplesmente lindas! A qualidade da pintura é impecável e o acabamento perfeito.",
              },
              {
                name: "João Santos",
                text: "Comprei uma placa personalizada e ficou incrível. Recomendo muito!",
              },
              {
                name: "Ana Costa",
                text: "Adorei o atendimento e a dedicação. Minhas peças chegaram com muito carinho.",
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="hover-lift transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {testimonial.text}
                  </p>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
