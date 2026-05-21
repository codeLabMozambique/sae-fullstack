# SAE Mobile — UI Refresh ✨

Camada visual nova para o teu projecto Flutter `sae-fullstack/sae-mobile/`,
respeitando **todos** os serviços, modelos e estado.

## Como aplicar

### 1) Copiar ficheiros

Copia tudo o que está em `flutter-out/lib/` para `sae-fullstack/sae-mobile/lib/`,
sobrescrevendo:

```bash
# Mac/Linux (a partir da raiz do teu workspace local):
cp -R caminho-deste-projeto/flutter-out/lib/* sae-fullstack/sae-mobile/lib/
```

### 2) Adicionar `lucide_icons` ao `pubspec.yaml`

Abre `sae-fullstack/sae-mobile/pubspec.yaml` e acrescenta esta linha em `dependencies:`

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  dio: ^5.4.0
  shared_preferences: ^2.2.2
  provider: ^6.1.1
  intl: ^0.19.0
  file_picker: ^8.0.0+1
  url_launcher: ^6.2.5
  cached_network_image: ^3.3.1
  flutter_pdfview: ^1.3.2
  path_provider: ^2.1.2
  photo_view: ^0.15.0
  speech_to_text: ^7.0.0
  flutter_tts: ^4.0.2
  connectivity_plus: ^6.0.5
  lucide_icons: ^0.257.0       # ← adicionar
```

### 3) `flutter pub get` e correr

```bash
cd sae-fullstack/sae-mobile
flutter pub get
flutter run
```

---

## Estrutura

```
flutter-out/lib/
├── main.dart                         (re)escrito — system UI overlay + fade entre login/home
├── theme.dart                        reescrito — paleta refinada, M3 polido
├── pages/
│   ├── login_page.dart               reescrito — hero navy + form fluido
│   ├── home_page.dart                reescrito — bottom nav M3, app bar com avatar
│   ├── biblioteca/biblioteca_page.dart   reescrito — capas gradiente, chips dark
│   ├── forum/
│   │   ├── forum_page.dart           reescrito — cards com badges
│   │   └── question_detail_page.dart reescrito — thread tipo chat
│   ├── tarefas/
│   │   ├── student_tasks_page.dart       reescrito — stats + urgência
│   │   ├── student_submissions_page.dart reescrito — nota grande + feedback
│   │   ├── professor_tasks_page.dart     reescrito — progress por tarefa
│   │   └── submit_task_page.dart         reescrito — upload dashed + meta-grid
│   └── quiz/
│       ├── student_quiz_page.dart    reescrito — streak banner + circular score
│       └── quiz_attempt_page.dart    reescrito — progress topo + opções animadas
└── widgets/
    ├── sae_tokens.dart               NOVO — paleta de disciplina (web parity)
    ├── sae_book_cover.dart           NOVO — capa gradiente com ícone
    ├── sae_components.dart           NOVO — SaeAppBar, SaeChip, SaePill, SaeCard…
    └── sae_skeleton.dart             NOVO — shimmer loaders
```

## Garantias

✅ **Todos** os serviços (`auth_service`, `content_service`, `forum_service`,
   `assignment_service`, `quiz_service`, `offline_service`, `user_service`,
   `speech_service`, `connectivity_service`) ficam **intactos**.
✅ **Todos** os modelos ficam intactos.
✅ O `state/auth_state.dart` fica intacto.
✅ Rotas e navegação preservadas — mesmos `MaterialPageRoute`s.
✅ `widgets/neumorphic.dart` mantido — páginas que não toquei continuam a funcionar.
✅ `widgets/empty_state.dart` e `widgets/sae_drawer.dart` mantidos.

## Páginas que **não** foram reescritas (e porquê)

| Página | Razão |
|---|---|
| `pages/biblioteca/leitor_page.dart` | Leitor PDF — toca em flutter_pdfview, deixei para evitar regressões. |
| `pages/biblioteca/{categorias,favoritos,continuar_ler,historico,offline}_page.dart` | Continuam a usar `NeuCard`/`NeuChip` — funcionam ok. Diz se queres modernizar também. |
| `pages/chat_ia_page.dart` | Lógica de streaming/sessão — pede para reescrever depois se quiseres. |
| `pages/dashboard_page.dart` | Não está exposto no nav actual. |
| `pages/file_viewer_page.dart` | Plumbing de PDF — preservar. |
| `pages/profile_page.dart` | Não toquei — mas o menu do avatar já abre-a. |
| `pages/quiz/{create_quiz,professor_quiz,quiz_result,student_results,certificates}_page.dart` | Pede reescrita se quiseres — eu deixei essas e o `_QuizList` é a vista principal. |
| `pages/tarefas/create_task_page.dart` | Fluxo do professor a criar tarefas — pede se quiseres. |
| `pages/forum/new_question_page.dart` | Pede se quiseres. |
| `pages/suggestions_page.dart` | Não exposto no nav actual. |

## Notas de design

- **Cores das disciplinas** mapeadas exactamente do `sae-frontend/src/pages/Biblioteca.tsx` (`COVER_CONFIG`).
- **Tipografia** Roboto-tight (letter-spacing negativo nos títulos).
- **Sombras subtis** em vez do neumorfismo agressivo (`SaeShadows.card`).
- **Animações** suaves em todo o lado: fade entre páginas, scale on press,
  staggered list-entry implícito via `TweenAnimationBuilder` no progress bar do quiz.
- **Lucide icons** em vez de Material para corresponder ao protótipo HTML.
- **Status bar** transparente, com ícones escuros (look "edge-to-edge" moderno).

## Resolver problemas

**Erro `Disciplines` não encontrado:** verifica que `widgets/sae_tokens.dart` está
copiado.

**Erro `lucide_icons` não encontrado:** correu `flutter pub get`?

**Texto cortado:** o tema limita o `textScaler` a 0.9–1.2× — se precisares de
acessibilidade mais ampla, edita `main.dart`.

**Páginas antigas com aspecto inconsistente:** algumas páginas não foram
reescritas (ver tabela acima). Diz-me qual queres modernizar e eu trato.
