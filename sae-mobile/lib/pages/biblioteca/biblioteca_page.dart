import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../services/content_service.dart';
import '../../services/offline_service.dart';
import '../../services/speech_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/sae_book_cover.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_skeleton.dart';
import '../../widgets/sae_tokens.dart';
import 'leitor_page.dart';
import 'categorias_page.dart';
import 'favoritos_page.dart';
import 'continuar_ler_page.dart';
import 'historico_page.dart';
import 'offline_page.dart';

/// Biblioteca — tabs por role + grid de capas com gradiente por disciplina.
/// Comporta-se igual ao original (mesmas APIs), só muda visual.
class BibliotecaPage extends StatefulWidget {
  const BibliotecaPage({super.key});
  @override
  State<BibliotecaPage> createState() => _BibliotecaPageState();
}

class _BibliotecaPageState extends State<BibliotecaPage> {
  int _tab = 0;

  List<({String label, Widget page})> _tabsFor(AuthState auth) {
    if (auth.isGuestRole) {
      return const [
        (label: 'Pesquisar',  page: BibliotecaPesquisar()),
        (label: 'Categorias', page: CategoriasPage()),
      ];
    }
    return const [
      (label: 'Pesquisar', page: BibliotecaPesquisar()),
      (label: 'Categorias', page: CategoriasPage()),
      (label: 'Offline',    page: OfflinePage()),
      (label: 'Favoritos',  page: FavoritosPage()),
      (label: 'Continuar',  page: ContinuarLerPage()),
      (label: 'Histórico',  page: HistoricoPage()),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final tabs = _tabsFor(auth);
    if (_tab >= tabs.length) _tab = 0;
    return Column(
      children: [
        SaeChipRow(
          items: tabs.map((t) => t.label).toList(),
          active: tabs[_tab].label,
          onPick: (l) => setState(() => _tab = tabs.indexWhere((t) => t.label == l)),
          dark: true,
        ),
        Expanded(child: tabs[_tab].page),
      ],
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// Pesquisar — grid principal
/// ───────────────────────────────────────────────────────────────────────────
class BibliotecaPesquisar extends StatefulWidget {
  const BibliotecaPesquisar({super.key});
  @override
  State<BibliotecaPesquisar> createState() => _BibliotecaPesquisarState();
}

class _BibliotecaPesquisarState extends State<BibliotecaPesquisar> {
  final _service = ContentService();
  final _searchCtrl = TextEditingController();
  List<Content> _items = [];
  bool _loading = true;
  String? _error;
  String? _disciplineFilter;
  List<String> _disciplines = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final q = _searchCtrl.text.trim();
      final res = q.isNotEmpty
          ? await _service.search(q)
          : await _service.listContents(discipline: _disciplineFilter);
      List<String> disc = _disciplines;
      if (disc.isEmpty) {
        try { disc = await _service.listDisciplines(); } catch (_) {}
      }
      setState(() {
        _items = res;
        _disciplines = disc;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Não foi possível carregar a biblioteca.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 4),
          child: SaeSearchField(
            controller: _searchCtrl,
            hint: 'Pesquisar título, autor, disciplina…',
            onSubmitted: (_) => _load(),
            onChanged: (_) => setState(() {}),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_searchCtrl.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 16),
                    color: SaeColors.textMuted,
                    onPressed: () {
                      _searchCtrl.clear();
                      _load();
                    },
                  ),
                IconButton(
                  tooltip: 'Pesquisar por voz',
                  icon: Icon(
                    VoiceSearch.instance.isListening ? LucideIcons.mic : LucideIcons.mic,
                    size: 17,
                    color: VoiceSearch.instance.isListening
                        ? SaeColors.error
                        : SaeColors.primary,
                  ),
                  onPressed: () async {
                    await VoiceSearch.instance.start(onResult: (t) {
                      _searchCtrl.text = t;
                      setState(() {});
                    });
                    if (mounted) {
                      setState(() {});
                      Future.delayed(const Duration(seconds: 4), () {
                        if (!mounted) return;
                        if (_searchCtrl.text.trim().isNotEmpty) _load();
                      });
                    }
                  },
                ),
              ],
            ),
          ),
        ),
        if (_disciplines.isNotEmpty) ...[
          const SizedBox(height: 6),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _disciplines.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return SaeChip(
                    label: 'Todas',
                    selected: _disciplineFilter == null,
                    onTap: () { setState(() => _disciplineFilter = null); _load(); },
                    dark: true,
                  );
                }
                final d = _disciplines[i - 1];
                return SaeChip(
                  label: d,
                  selected: _disciplineFilter == d,
                  onTap: () { setState(() => _disciplineFilter = d); _load(); },
                  dark: true,
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 6),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (_loading) {
      return GridView.builder(
        padding: const EdgeInsets.all(14),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 200, childAspectRatio: 0.66,
          crossAxisSpacing: 12, mainAxisSpacing: 12,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: SaeColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: const [
              Expanded(child: SaeSkeleton(radius: 14)),
              Padding(
                padding: EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SaeSkeleton(height: 12),
                    SizedBox(height: 6),
                    SaeSkeleton(height: 10, width: 80),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }
    if (_error != null) {
      return SaeEmpty(
        icon: LucideIcons.wifiOff,
        title: _error!,
        action: OutlinedButton.icon(
          onPressed: _load,
          icon: const Icon(LucideIcons.refreshCw, size: 14),
          label: const Text('Tentar novamente'),
        ),
      );
    }
    if (_items.isEmpty) {
      return const SaeEmpty(
        icon: LucideIcons.bookOpen,
        title: 'Nenhum conteúdo encontrado',
        subtitle: 'Experimenta outra pesquisa ou filtro.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: SaeColors.primary,
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 24),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 200, childAspectRatio: 0.62,
          crossAxisSpacing: 12, mainAxisSpacing: 12,
        ),
        itemCount: _items.length,
        itemBuilder: (_, i) => BookCard(content: _items[i]),
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// BookCard — cartão de livro (capa gradiente + título + chips)
/// ───────────────────────────────────────────────────────────────────────────
class BookCard extends StatelessWidget {
  final Content content;
  const BookCard({super.key, required this.content});

  @override
  Widget build(BuildContext context) {
    final service = ContentService();
    final thumbUrl = service.absoluteUrl(content.thumbnailUrl);

    return SaeCard(
      padding: EdgeInsets.zero,
      radius: 14,
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => LeitorPage(content: content),
      )),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Cover
          AspectRatio(
            aspectRatio: 0.85,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (thumbUrl != null)
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                    child: CachedNetworkImage(
                      imageUrl: thumbUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: SaeColors.line2),
                      errorWidget: (_, __, ___) => SaeBookCover(
                        discipline: content.discipline,
                        title: content.title,
                        author: content.uploadedNameOrNull(),
                        compact: true,
                      ),
                    ),
                  )
                else
                  SaeBookCover(
                    discipline: content.discipline,
                    title: content.title,
                    author: content.uploadedNameOrNull(),
                    compact: true,
                  ),
                // Top-right icons
                Positioned(
                  right: 6, top: 6,
                  child: Row(children: [
                    if (OfflineService.instance.isDownloaded(content.id))
                      _badge(LucideIcons.downloadCloud, SaeColors.primary),
                    const SizedBox(width: 4),
                    InkWell(
                      onTap: () {
                        Tts.instance.speak([
                          content.title,
                          if (content.discipline != null) content.discipline,
                          if (content.description != null) content.description,
                        ].whereType<String>().join('. '));
                      },
                      borderRadius: BorderRadius.circular(999),
                      child: _badge(LucideIcons.volume2, SaeColors.primary),
                    ),
                  ]),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(content.title,
                  maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 12.5,
                    color: SaeColors.textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 4),
                if (content.discipline != null)
                  _disciplineChip(content.discipline!),
                const SizedBox(height: 3),
                Row(children: [
                  if (content.year != null)
                    Text('${content.year}',
                      style: const TextStyle(color: SaeColors.textMuted, fontSize: 10.5),
                    ),
                  if (content.year != null && content.totalPages != null)
                    const Text(' · ', style: TextStyle(color: SaeColors.textMuted, fontSize: 10.5)),
                  if (content.totalPages != null)
                    Text('${content.totalPages} pág.',
                      style: const TextStyle(color: SaeColors.textMuted, fontSize: 10.5),
                    ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(IconData icon, Color color) => Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.92),
          shape: BoxShape.circle,
          boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 4)],
        ),
        child: Icon(icon, size: 13, color: color),
      );

  Widget _disciplineChip(String text) {
    final s = Disciplines.of(text);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
      decoration: BoxDecoration(
        color: s.chipBg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text, style: TextStyle(
        color: s.chipFg,
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.1,
      )),
    );
  }
}

/// Helper to read uploadedBy name from Content (model has `uploadedByName?` ou `uploadedBy?`).
/// O Content original tem `uploadedBy` / `uploadedByName` em alguns places — caímos em null silenciosamente.
extension on Content {
  String? uploadedNameOrNull() {
    try {
      // ignore: avoid_dynamic_calls
      final dyn = this as dynamic;
      return (dyn.uploadedByName ?? dyn.uploadedBy) as String?;
    } catch (_) {
      return null;
    }
  }
}
