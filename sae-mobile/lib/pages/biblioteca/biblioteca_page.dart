import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../services/content_service.dart';
import '../../theme.dart';
import 'leitor_page.dart';

class BibliotecaPage extends StatefulWidget {
  const BibliotecaPage({super.key});
  @override
  State<BibliotecaPage> createState() => _BibliotecaPageState();
}

class _BibliotecaPageState extends State<BibliotecaPage> {
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
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Pesquisar título, autor, disciplina...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchCtrl.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchCtrl.clear();
                        _load();
                      },
                    ),
            ),
            onSubmitted: (_) => _load(),
            onChanged: (_) => setState(() {}),
          ),
        ),
        if (_disciplines.isNotEmpty)
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _chip('Todas', _disciplineFilter == null, () {
                  setState(() => _disciplineFilter = null);
                  _load();
                }),
                ..._disciplines.map((d) => _chip(d, _disciplineFilter == d, () {
                      setState(() => _disciplineFilter = d);
                      _load();
                    })),
              ],
            ),
          ),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: SaeColors.primary,
        labelStyle: TextStyle(
          color: selected ? Colors.white : SaeColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        backgroundColor: Colors.white,
        side: const BorderSide(color: Color(0x22000000)),
      ),
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
            OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
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
        padding: const EdgeInsets.all(12),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 200,
          childAspectRatio: 0.62,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _items.length,
        itemBuilder: (_, i) => _BookCard(content: _items[i]),
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final Content content;
  const _BookCard({required this.content});

  @override
  Widget build(BuildContext context) {
    final service = ContentService();
    final thumb = service.absoluteUrl(content.thumbnailUrl);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => LeitorPage(content: content),
        ));
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x14000000)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Container(
                color: const Color(0xFFF1F5F9),
                alignment: Alignment.center,
                child: thumb == null
                    ? const Icon(Icons.menu_book, color: SaeColors.primary, size: 42)
                    : CachedNetworkImage(
                        imageUrl: thumb,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                        errorWidget: (_, __, ___) =>
                            const Icon(Icons.menu_book, color: SaeColors.primary, size: 42),
                      ),
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
                    [content.discipline, content.level].where((e) => e != null && e.isNotEmpty).join(' • '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: SaeColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
