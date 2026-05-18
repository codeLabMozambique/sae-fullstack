# SAE Mobile

Aplicação Android (Flutter) do SAE para **alunos** e **professores**.
Consome o mesmo backend da aplicação web (gateway na porta `8080`).

## Funcionalidades

**Aluno**
- Tarefas atribuídas + submissão de trabalhos (com ficheiro e comentário)
- Lista das suas submissões e notas
- Fórum (criar/ver perguntas, responder, aceitar respostas)
- Biblioteca (pesquisar, filtrar por disciplina, ler PDF in-app)

**Professor**
- Tarefas que criou + ver submissões e atribuir notas
- Fórum (incluindo caixa de pendentes e respondidas)
- Biblioteca

## Configuração

A `baseUrl` por defeito está em `lib/services/api_client.dart`:

```dart
static const String defaultBaseUrl = 'http://10.0.2.2:8080';
```

`10.0.2.2` é o endereço do host visto pelo **emulador Android**.
Se for testar em dispositivo físico, troque para o IP do PC (ex: `http://192.168.1.10:8080`).
Cleartext HTTP está activado no `AndroidManifest.xml` para desenvolvimento.

## Correr

```bash
flutter pub get
flutter run
```

## Estrutura

```
lib/
  main.dart                 # entry + ChangeNotifierProvider(AuthState)
  theme.dart                # cores SAE: #00A651 (primary), #0A1628 (secondary)
  services/                 # api_client, auth, content, forum, assignment
  state/                    # AuthState
  pages/
    login_page.dart
    home_page.dart          # bottom nav (Tarefas/Fórum/Biblioteca [+Submissões para aluno])
    biblioteca/             # lista + leitor PDF (flutter_pdfview)
    forum/                  # lista + detalhe + nova pergunta
    tarefas/                # student tasks/submit/submissions + professor tasks/grade
```
