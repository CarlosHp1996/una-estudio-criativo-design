import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import UserMenu from "./UserMenu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items } = useCart();
  const location = useLocation();
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isHomePage = location.pathname === "/";

  const scrollToSection = (sectionId: string) => {
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80; // altura do header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  const handleNavClick = (to: string, sectionId?: string) => {
    setIsMenuOpen(false);
    if (sectionId && isHomePage) {
      scrollToSection(sectionId);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 min-w-0 flex-shrink-0"
          >
            <div className="text-xl md:text-2xl font-serif font-bold text-primary">
              UNA <span className="font-light">Estudio Criativo</span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center gap-8">
              {isHomePage ? (
                <>
                  <button
                    onClick={() => scrollToSection("inicio")}
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Início
                  </button>
                  <button
                    onClick={() => scrollToSection("produtos")}
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Produtos
                  </button>
                  <button
                    onClick={() => scrollToSection("sobre")}
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Sobre
                  </button>
                  <Link
                    to="/contato"
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Contato
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Início
                  </Link>
                  <Link
                    to="/produtos"
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Produtos
                  </Link>
                  <Link
                    to="/sobre"
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Sobre
                  </Link>
                  <Link
                    to="/contato"
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Contato
                  </Link>
                  <Link
                    to="/rastreamento"
                    className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    Rastreamento
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* User Menu & Cart - Right Side */}
          <div className="flex items-center gap-2">
            {/* User Menu - Hidden on Mobile */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Cart */}
            <Link to="/carrinho">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-4 flex flex-col gap-4 border-t border-border">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link
              to="/produtos"
              className="text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Produtos
            </Link>
            <Link
              to="/sobre"
              className="text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              to="/contato"
              className="text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Contato
            </Link>
            <Link
              to="/rastreamento"
              className="text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Rastreamento
            </Link>

            {/* Mobile User Menu */}
            <div className="pt-2 border-t border-border">
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="text-foreground hover:text-primary transition-smooth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Fazer Login
                </Link>
                <Link
                  to="/registro"
                  className="text-foreground hover:text-primary transition-smooth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Criar Conta
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
