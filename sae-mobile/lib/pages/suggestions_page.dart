import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/content_service.dart';
import '../services/suggestion_service.dart';
import '../services/user_service.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/neumorphic.dart';
import 'biblioteca/leitor_page.dart';

class SuggestionsPage extends StatefulWidget {
  const SuggestionsPage({super.key});
  @override
  State<SuggestionsPage> createState() => _SuggestionsPageState();
}

class _SuggestionsPageState extends State<SuggestionsPage> {
  final _service = SuggestionService();
  final _userService = UserService();
  final _content = ContentService();
  List<ReadingSuggestion> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthState>();
      if (auth.isProfessor) {
        _items = await _service.listMine();
      } else {
        final ids = await _userService.myStudentClassroomIds(auth.user?.username ?? '');
        _items = ids.isEmpty ? [] : await _service.listForStudent(ids);
      }
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar sugestões.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(int id) async {
    try {
      await _service.delete(id);
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isProf = context.watch<AuthState>().isProfessor;
    return Scaffold(
      backgroundColor: SaeColors.bg,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _items.isEmpty
                  ? _empty(isProf)
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(14),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => _tile(_items[i], isProf),
                      ),
                    ),
      floatingActionButton: isProf
          ? FloatingActionButton.extended(
              backgroundColor: SaeColors.primary,
              foregroundColor: Colors.white,
              onPressed: () async {
                final created = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(builder: (_) => const CreateSuggestionPage()),
                );
                if (created == true) _load();
              },
              icon: const Icon(Icons.add),
              label: const Text('Nova sugestão'),
            )
          : null,
    );
  }

  Widget _empty(bool isProf) => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.recommend, size: 56, color: SaeColors.textSecondary),
              const SizedBox(height: 12),
              Text(
                isProf ? 'Ainda não criou sugestões.' : 'Ainda não tem sugestões.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
              const SizedBox(height: 4),
              const Text(
                'Sugestões de leitura aparecem aqui.',
                textAlign: TextAlign.center,
                style: TextStyle(color: SaeColors.textSecondary, fontSize: 13),
              ),
            ],
          ),
        ),
      );

  Widget _tile(ReadingSuggestion s, bool isProf) {
    final thumb = _content.absoluteUrl(s.contentThumbnailUrl);
    String when = s.createdAt;
    try {
      when = DateFormat('dd/MM/yyyy').format(DateTime.parse(s.createdAt).toLocal());
    } catch (_) {}
    return NeuCard(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => LeitorPage(
          content: Content(
            id: s.contentId,
            title: s.contentTitle,
            thumbnailUrl: s.contentThumbnailUrl,
          ),
          initialPage: s.startPage,
        ),
      )),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            width: 56, height: 76,
            child: thumb == null
                ? Container(
                    color: const Color(0xFFE6ECEA),
                    child: const Icon(Icons.menu_book, color: SaeColors.primary))
                : CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s.contentTitle,
                  style: const TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(
                [
                  if (s.chapterRange != null && s.chapterRange!.isNotEmpty)
                    s.chapterRange!,
                  if (s.startPage != null && s.endPage != null)
                    'pp. ${s.startPage}-${s.endPage}',
                  s.professorName ?? s.professorUsername,
                  when,
                ].join(' · '),
                style: const TextStyle(
                    color: SaeColors.textSecondary, fontSize: 12),
              ),
              if (s.note != null && s.note!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(s.note!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13)),
              ],
            ],
          ),
        ),
        if (isProf)
          IconButton(
            icon: const Icon(Icons.delete_outline, color: SaeColors.textSecondary),
            onPressed: () => _delete(s.id),
          ),
      ]),
    );
  }
}

class CreateSuggestionPage extends StatefulWidget {
  const CreateSuggestionPage({super.key});
  @override
  State<CreateSuggestionPage> createState() => _CreateSuggestionPageState();
}

class _CreateSuggestionPageState extends State<CreateSuggestionPage> {
  final _service = SuggestionService();
  final _content = ContentService();
  final _userService = UserService();
  final _contentIdCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  final _chapterCtrl = TextEditingController();
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  List<Content> _matches = [];
  Content? _selected;
  bool _saving = false;
  List<ProfessorClassroom> _classrooms = [];
  final Set<int> _selectedClassrooms = {};
  bool _loadingClassrooms = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadClassrooms());
  }

  Future<void> _loadClassrooms() async {
    final auth = context.read<AuthState>();
    final list = await _userService.professorClassrooms(auth.user?.username ?? '');
    if (!mounted) return;
    setState(() {
      _classrooms = list;
      _loadingClassrooms = false;
    });
  }

  Future<void> _search(String q) async {
    if (q.trim().isEmpty) {
      setState(() => _matches = []);
      return;
    }
    try {
      _matches = await _content.search(q);
    } catch (_) {}
    if (mounted) setState(() {});
  }

  Future<void> _submit() async {
    if (_selected == null || _selectedClassrooms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Escolha um conteúdo e pelo menos uma turma.')));
      return;
    }
    setState(() => _saving = true);
    try {
      await _service.create(
        contentId: _selected!.id,
        classroomIds: _selectedClassrooms.toList(),
        note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
        chapterRange: _chapterCtrl.text.trim().isEmpty ? null : _chapterCtrl.text.trim(),
        startPage: int.tryParse(_startCtrl.text.trim()),
        endPage: int.tryParse(_endCtrl.text.trim()),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Falha ao criar sugestão.')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      appBar: AppBar(title: const Text('Nova sugestão')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 24),
          children: [
            NeuTextField(
              controller: _contentIdCtrl,
              labelText: 'Pesquisar conteúdo',
              prefixIcon: Icons.search,
              onChanged: _search,
            ),
            const SizedBox(height: 10),
            if (_matches.isNotEmpty)
              ..._matches.take(5).map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: NeuCard(
                      pressed: _selected?.id == c.id,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      onTap: () => setState(() => _selected = c),
                      child: Row(children: [
                        const Icon(Icons.menu_book, color: SaeColors.primary, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                            child: Text(c.title,
                                style: const TextStyle(fontWeight: FontWeight.w700))),
                        if (_selected?.id == c.id)
                          const Icon(Icons.check, color: SaeColors.primary),
                      ]),
                    ),
                  )),
            const SizedBox(height: 14),
            const Text('Turmas atribuídas',
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: SaeColors.textSecondary,
                    fontSize: 12)),
            const SizedBox(height: 6),
            if (_loadingClassrooms)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              )
            else if (_classrooms.isEmpty)
              NeuCard(
                padding: const EdgeInsets.all(14),
                child: Row(children: const [
                  Icon(Icons.info_outline, color: SaeColors.error),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                        'Sem turmas atribuídas. Contacte o administrador.',
                        style: TextStyle(fontSize: 13)),
                  ),
                ]),
              )
            else
              Wrap(
                spacing: 6, runSpacing: 4,
                children: _classrooms.map((c) {
                  final selected = _selectedClassrooms.contains(c.id);
                  final label = [
                    c.name,
                    if (c.classLevelName != null) c.classLevelName,
                    if (c.subjectName != null) c.subjectName,
                  ].whereType<String>().join(' · ');
                  return NeuChip(
                    label: label,
                    selected: selected,
                    onTap: () => setState(() {
                      if (selected) {
                        _selectedClassrooms.remove(c.id);
                      } else {
                        _selectedClassrooms.add(c.id);
                      }
                    }),
                  );
                }).toList(),
              ),
            const SizedBox(height: 14),
            NeuTextField(
              controller: _chapterCtrl,
              labelText: 'Capítulo (opcional)',
              prefixIcon: Icons.bookmark_outline,
            ),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                child: NeuTextField(
                  controller: _startCtrl,
                  labelText: 'Pág. inicial',
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: NeuTextField(
                  controller: _endCtrl,
                  labelText: 'Pág. final',
                  keyboardType: TextInputType.number,
                ),
              ),
            ]),
            const SizedBox(height: 10),
            NeuTextField(
              controller: _noteCtrl,
              labelText: 'Nota para os alunos (opcional)',
              minLines: 2, maxLines: 4,
            ),
            const SizedBox(height: 18),
            NeuPrimaryButton(
              label: 'Publicar sugestão',
              icon: Icons.send,
              loading: _saving,
              onPressed: _classrooms.isEmpty ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
