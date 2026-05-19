import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/content_service.dart';
import '../../services/offline_service.dart';
import '../../services/speech_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';
import 'leitor_page.dart';
import 'categorias_page.dart';
import 'favoritos_page.dart';
import 'continuar_ler_page.dart';
import 'historico_page.dart';

/// Biblioteca — replica exactamente os menus do seed.sql:
///  - STUDENT/PROFESSOR/ADMIN: Pesquisar · Categorias · Favoritos · Continuar a Ler · Histórico
///  - GUEST: Pesquisar · Categorias (sem favoritos/histórico — endpoints exigem auth)
class BibliotecaPage extends StatefulWidget {
  const BibliotecaPage({super.key});
  @override
  State<BibliotecaPage> createState() => _BibliotecaPageState();
}

class _BibliotecaPageState extends State<BibliotecaPage> {
  int _tab = 0;

  List<({String label, IconData icon, Widget page})> _tabsFor(BuildContext ctx) {
    final auth = ctx.read<AuthState>();
    if (auth.isGuestRole) {
      return [
        (label: 'Pesquisar', icon: Icons.search, page: const BibliotecaPesquisar()),
        (label: 'Categorias', icon: Icons.category, page: const CategoriasPage()),
      ];
    }
    return [
      (label: 'Pesquisar', icon: Icons.search, page: const BibliotecaPesquisar()),
      (label: 'Categorias', icon: Icons.category, page: const CategoriasPage()),
      (label: 'Favoritos', icon: Icons.bookmark, page: const FavoritosPage()),
      (label: 'Continuar', icon: Icons.menu_book, page: const ContinuarLerPage()),
      (label: 'Histórico', icon: Icons.history, page: const HistoricoPage()),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final tabs = _tabsFor(context);
    if (_tab >= tabs.length) _tab = 0;
    return Column(
      children: [
        SizedBox(
          height: 56,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: tabs.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.only(right: 4),
              child: NeuChip(
                label: tabs[i].label,
                selected: i == _tab,
                onTap: () => setState(() => _tab = i),
              ),
            ),
          ),
        ),
        Expanded(child: tabs[_tab].page),
      ],
    );
  }
}

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
        try {
          disc = await _service.listDisciplines();
        } catch (_) {}
      }
      setState(() {
        _items = res;
        _disciplines = disc;
        _loading = false;
      });
    } catch (e) {
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
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
          child: NeuTextField(
            controller: _searchCtrl,
            hintText: 'Pesquisar título, disciplina...',
            prefixIcon: Icons.search,
            suffixIcon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_searchCtrl.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchCtrl.clear();
                      _load();
                    },
                  ),
                IconButton(
                  tooltip: 'Pesquisar por voz',
                  icon: Icon(
                    VoiceSearch.instance.isListening ? Icons.mic : Icons.mic_none,
                    color: VoiceSearch.instance.isListening
                        ? SaeColors.primary
                        : SaeColors.textSecondary,
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
            onSubmitted: (_) => _load(),
            onChanged: (_) => setState(() {}),
          ),
        ),
        if (_disciplines.isNotEmpty)
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                NeuChip(
                  label: 'Todas',
                  selected: _disciplineFilter == null,
                  onTap: () {
                    setState(() => _disciplineFilter = null);
                    _load();
                  },
                ),
                ..._disciplines.map((d) => NeuChip(
                      label: d,
                      selected: _disciplineFilter == d,
                      onTap: () {
                        setState(() => _disciplineFilter = d);
                        _load();
                      },
                    )),
              ],
            ),
          ),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 8),
            NeuPrimaryButton(label: 'Tentar novamente', onPressed: _load, expanded: false),
          ],
        ),
      );
    }
    if (_items.isEmpty) {
      return const Center(child: Text('Sem conteúdos.'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.all(14),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 190,
          childAspectRatio: 0.66,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _items.length,
        itemBuilder: (_, i) => BookCard(content: _items[i]),
      ),
    );
  }
}

class BookCard extends StatelessWidget {
  final Content content;
  const BookCard({super.key, required this.content});

  @override
  Widget build(BuildContext context) {
    final service = ContentService();
    final thumb = service.absoluteUrl(content.thumbnailUrl);
    return NeuCard(
      padding: EdgeInsets.zero,
      radius: 18,
      onTap: () {
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => LeitorPage(content: content),
        ));
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(18)),
                  child: Container(
                    color: const Color(0xFFE6ECEA),
                    alignment: Alignment.center,
                    child: thumb == null
                        ? const Icon(Icons.menu_book,
                            color: SaeColors.primary, size: 42)
                        : CachedNetworkImage(
                            imageUrl: thumb,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const Center(
                                child:
                                    CircularProgressIndicator(strokeWidth: 2)),
                            errorWidget: (_, __, ___) => const Icon(
                                Icons.menu_book,
                                color: SaeColors.primary,
                                size: 42),
                          ),
                  ),
                ),
              Positioned(
                right: 6, top: 6,
                child: Row(children: [
                  if (OfflineService.instance.isDownloaded(content.id))
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.85),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.offline_pin,
                          size: 14, color: SaeColors.primary),
                    ),
                  const SizedBox(width: 4),
                  Material(
                    color: Colors.white.withValues(alpha: 0.85),
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () {
                        Tts.instance.speak([
                          content.title,
                          if (content.discipline != null) content.discipline,
                          if (content.description != null) content.description,
                        ].whereType<String>().join('. '));
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(6),
                        child: Icon(Icons.volume_up,
                            size: 16, color: SaeColors.primary),
                      ),
                    ),
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
                Text(
                  content.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  [content.discipline, content.level]
                      .where((e) => e != null && e.isNotEmpty)
                      .join(' • '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: SaeColors.textSecondary, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
