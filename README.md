# Sítio Salvador — site demonstrativo

Protótipo navegável preparado para aprovação do cliente e, depois, publicação via GitHub + Render.

## O que já está incluído
- animação de abertura do logotipo;
- página inicial premium e responsiva;
- páginas: O Espaço, Eventos, Casamentos, Gastronomia, Galeria e Contato;
- vídeo real do espaço;
- galeria com fotos fornecidas;
- seção de Instagram com fallback local;
- backend preparado para sincronização automática do Instagram via Meta Graph API;
- `render.yaml` pronto para deploy no Render;
- formulário visual pronto para conectar a WhatsApp, e-mail ou CRM.

## Rodar localmente
```bash
npm install
npm start
```
Abra: `http://localhost:3000`

## Instagram automático
A prévia mostra fotos locais quando as credenciais não estão configuradas. Para ativar posts reais de uma conta profissional Business/Creator, defina no Render:
- `IG_USER_ID`
- `IG_ACCESS_TOKEN`
- `IG_GRAPH_VERSION` (há um valor padrão no projeto)

O token fica no servidor e não é exposto no navegador.

## Antes da publicação final
Substituir/adicionar, quando o cliente fornecer:
- WhatsApp oficial;
- endereço/localização;
- capacidade e estrutura detalhada;
- regras/pacotes/serviços;
- dados corretos da conta Meta para o feed do Instagram.
