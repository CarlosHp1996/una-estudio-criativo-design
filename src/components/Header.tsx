import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import UserMenu from "./UserMenu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items } = useCart();
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-smooth"
              >
                Início
              </Link>
              <Link
                to="/produtos"
                className="text-foreground hover:text-primary transition-smooth"
              >
                Produtos
              </Link>
              <Link
                to="/sobre"
                className="text-foreground hover:text-primary transition-smooth"
              >
                Sobre
              </Link>
              <Link
                to="/contato"
                className="text-foreground hover:text-primary transition-smooth"
              >
                Contato
              </Link>
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
        {isMenuOpen && (
          <nav className="md:hidden py-4 flex flex-col gap-4 border-t border-border">
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
        )}
      </div>
    </header>
  );
};

export default Header;
