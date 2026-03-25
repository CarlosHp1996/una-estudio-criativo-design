# UNA Estudio Criativo - Frontend E-commerce

Frontend do e-commerce da UNA Estudio Criativo, especializada em arte pintada à mão com peças únicas em madeira, cerâmica e vidro.

## Stack Tecnológico

- **React 18.3.1** com TypeScript
- **Vite** como ferramenta de build
- **Tailwind CSS** para estilização
- **React Router v6** para navegação
- **Radix UI** para componentes acessíveis
- **React Hook Form + Zod** para formulários e validação
- **Context API** para gerenciamento de estado

## Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- pnpm (gerenciador de pacotes)

### Instalação e Execução

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm preview
```

### Scripts Disponíveis

```json
{
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## Estrutura do Projeto

```
src/
├── assets/           # Imagens, ícones, fonts
├── components/       # Componentes reutilizáveis
│   └── ui/          # Componentes UI base (Radix)
├── contexts/        # React Contexts (Cart, Auth)
├── data/            # Dados estáticos e mocks
├── hooks/           # Custom hooks
├── layouts/         # Layout components
├── lib/             # Utilitários e configurações
├── pages/           # Componentes de página
└── types/           # Tipos TypeScript
```

## Funcionalidades

### Implementadas

- ✅ Catálogo de produtos com filtros
- ✅ Carrinho de compras local
- ✅ Design responsivo
- ✅ Navegação principal
- ✅ Páginas: Home, Produtos, Sobre, Contato, Carrinho, Checkout

### Em Desenvolvimento

- 🚧 Sistema de autenticação de usuários
- 🚧 Dashboard do usuário
- 🚧 Integração com API backend
- 🚧 Login social (Google/Facebook)

## Deploy

O projeto está configurado para deploy automático no Vercel/Netlify através de push no repositório.

---

**UNA Estudio Criativo** - Arte feita à mão com amor ❤️
