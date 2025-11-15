import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-serif font-bold text-primary mb-4">
              UNA Estudio Criativo
            </h3>
            <p className="text-muted-foreground mb-4">
              Arte feita à mão com amor e dedicação. Peças únicas que transformam seus espaços em ambientes especiais.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:contato@unaestudio.com"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="tel:+5511999999999"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Menu</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-smooth">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/produtos" className="text-muted-foreground hover:text-primary transition-smooth">
                  Produtos
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-smooth">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-muted-foreground hover:text-primary transition-smooth">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Atendimento</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Segunda a Sexta</li>
              <li>9h às 18h</li>
              <li className="pt-2">
                <a href="mailto:contato@unaestudio.com" className="hover:text-primary transition-smooth">
                  contato@unaestudio.com
                </a>
              </li>
              <li>
                <a href="tel:+5511999999999" className="hover:text-primary transition-smooth">
                  (11) 99999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UNA Estudio Criativo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
