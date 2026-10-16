# SmartList — visual atualizado

Interface renovada para celular e computador, preservando a integração Firebase existente.

## Novidades
- Navegação lateral entre listas em telas grandes.
- Resumo de itens, progresso e total do carrinho.
- Filtros Todos, Pendentes e No carrinho, com busca por nome.
- Preço e quantidade disponíveis antes de marcar o produto.
- Layout adaptado para telas pequenas e foco visível para teclado.

## Executar
Instale Node.js e execute nesta pasta:

    npm install
    npm run dev

Abra http://localhost:3000.

Para produção:

    npm run build
    npm start

## Serviços existentes
A configuração original do Firebase está em src/lib/firebase.ts. O login anônimo e as regras do Firestore precisam permitir as operações da aplicação.
O assistente mantém o serviço Gemini original e requer GEMINI_API_KEY em .env.local. Esse arquivo não acompanha o projeto.

## Verificação
Compilação de produção e verificação TypeScript concluídas. Prévia móvel e filtro de pendentes conferidos no navegador. Não foram alterados itens salvos durante a verificação. O assistente não foi testado, pois a chave Gemini não veio no ZIP original.
