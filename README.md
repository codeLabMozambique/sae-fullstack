📚 SAE - Sistema de Apoio de Aprendizagem ao Estudante
StatusReactTypeScriptViteTailwindCSS

Plataforma digital inovadora para apoiar estudantes do ensino secundário em Moçambique.

🎯 Sobre o Projeto
O SAE é uma solução desenvolvida no âmbito do Hackathon de Serviços Digitais para Educação - Projeto Abraço Digital!, visando democratizar o acesso à educação de qualidade.

Funcionalidades Principais
📖 Biblioteca Digital - Acesso a livros e materiais didáticos offline
🤖 Chat IA Educacional - Assistente virtual 24/7 para dúvidas pedagógicas
📝 Sistema de Quizzes - Preparação para exames com feedback imediato
💬 Fórum Colaborativo - Interação entre estudantes e professores

🚀 Stack Tecnológico
Tecnologia	  Versão	Descrição
React	        18.2	  Biblioteca UI
TypeScript	  5.3	    Tipagem estática
Vite	        5.1	    Build tool
TailwindCSS	  3.4	    Styling
Redux Toolkit	2.2	    State management
React Query	  3.39	  Data fetching


PWA	-	Funcionalidade offline
📦 Instalação
# Clonar o repositóriogit clone:
    https://github.com/sae-mozambique/sae-frontend.git
# Entrar na pasta
    cd sae-fullstack
# Instalar dependências 
    npm install
# Iniciar servidor de desenvolvimento
    npm run dev


🐳 Docker
# Build da imagem
    docker build -t sae-fullstack .
# Executar container
    docker run -p 80:80 sae-fullstack


📁 Estrutura do Projeto
src/
├── components/     # Componentes reutilizáveis
├── hooks/          # Custom hooks
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API
├── store/          # Redux store
├── styles/         # Estilos globais
├── types/          # Tipagens TypeScript
└── utils/          # Utilitários

👥 Equipa
    Alex Jeremias Alfai - Frontend Developer
    Arsenio Francisco Baquir - Backend Developer
    Lourindo Eugénio João - DevOps Engineer
    Noemy Cristina Suzana Manuel - Marketing
    Shelton Faustino Djedje - UI/UX Designer

📄 Licença
Este projeto está sob a licença MIT.

Desenvolvido com vontade para a educação moçambicana | Hackathon Abraço Digital 2025

---

## 📋 PASSO 12: Comandos para Executar Localmente

```bash
# 1. Criar o projeto
npm create vite@latest sae-fullstack -- --template react-ts

# 2. Entrar na pasta
cd sae-fullstack

# 3. Instalar dependências
npm install react-router-dom @reduxjs/toolkit react-redux axios react-hook-form zod @hookform/resolvers lucide-react clsx tailwindcss postcss autoprefixer vite-plugin-pwa workbox-window

# 4. Instalar devDependencies
npm install -D @types/react @types/react-dom @vitejs/plugin-react typescript eslint prettier vitest

# 5. Inicializar Tailwind
npx tailwindcss init -p

# 6. Iniciar o servidor
npm run dev
