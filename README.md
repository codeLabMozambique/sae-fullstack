# SAE - Frontend

Sistema de Apoio ao Estudante — plataforma moderna para gestão de aprendizagem.

## Tecnologias

- React 18 + TypeScript
- Vite + SWC
- Material UI (MUI) v5
- TailwindCSS
- React Router DOM
- React Hook Form + Zod
- Axios
- Vitest
- PWA (Progressive Web App)

## Estrutura
sae-frontend/
├── src/
│ ├── components/ # Componentes reutilizáveis
│ │ ├── common/ # Button, Card, Input, Modal
│ │ └── layout/ # Header, Footer, Sidebar
│ ├── pages/ # Páginas da aplicação
│ ├── hooks/ # Hooks personalizados
│ ├── services/ # Chamadas API
│ ├── types/ # Definições TypeScript
│ ├── utils/ # Funções utilitárias
│ ├── styles/ # Estilos globais
│ └── assets/ # Imagens e ícones
├── public/ # Arquivos estáticos
│ └── icons/ # Ícones PWA
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .gitignore
└── README.md


## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sae-frontend.git

# Acesse o diretório
cd sae-frontend

# Instale as dependências
npm install

PWA
O projeto está configurado como Progressive Web App. Para gerar os ícones necessários:

Coloque os ícones nas seguintes dimensões em /public/icons/:

72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Execute npm run build

O service worker será gerado automaticamente

Testes
bash
# Executar testes
npm run test

# Executar com interface visual
npm run test:ui
Build
bash
# Gerar build de produção
npm run build

# Os arquivos estarão em /dist
Contribuição
Fork o projeto

Crie sua branch de feature (git checkout -b feature/nova-funcionalidade)

Commit suas alterações (git commit -m 'feat: adicionar nova funcionalidade')

Push para a branch (git push origin feature/nova-funcionalidade)

Abra um Pull Request

Licença
MIT