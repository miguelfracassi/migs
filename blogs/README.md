# Blog do site (migfracassi.fun)

Novas rotas:

- `/blog` lista dos posts (com filtro por categoria)
- `/blog/post?slug=...` página de cada post
- `/blog/publicar` painel com senha: criar, editar e apagar posts, e o botão "Ajuda com Bup IA"

## Como colocar no ar (Vercel)

1. Suba esta pasta inteira na raiz do repositório (ela já tem `package.json` e a pasta `api/`).
2. Na Vercel: **Storage > Neon > Connect Project**. Isso cria a variável `DATABASE_URL`.
3. Em **Settings > Environment Variables**, adicione `GROQ_API_KEY` com a chave de console.groq.com.
4. Faça o deploy. As tabelas (`blog_posts` e `blog_images`) são criadas sozinhas no primeiro acesso.

Variáveis opcionais:

- `BLOG_PASSWORD`: troca a senha do painel (se não existir, a senha é `2015`)
- `GROQ_MODEL`: modelo preferido da IA (padrão `openai/gpt-oss-120b`; se falhar, tenta `qwen/qwen3.6-27b` e `openai/gpt-oss-20b`)

## Como funciona

- A senha é conferida no servidor (`api/_db.js`), não só na tela.
- As imagens são reduzidas no navegador (máx. 1400px) e guardadas no Neon; cada uma sobe numa requisição própria.
- A IA do Bup (`api/ai.js`) usa a API do Groq. Ela não vê as fotos, por isso o Bup pergunta o que aparece nelas.
