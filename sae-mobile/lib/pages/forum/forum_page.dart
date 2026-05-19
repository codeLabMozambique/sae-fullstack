import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/forum_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';
import 'question_detail_page.dart';
import 'new_question_page.dart';

class ForumPage extends StatefulWidget {
  const ForumPage({super.key});
  @override
  State<ForumPage> createState() => _ForumPageState();
}

class _ForumPageState extends State<ForumPage> with SingleTickerProviderStateMixin {
  final _service = ForumService();
  late TabController _tab;
  bool _loading = true;
  String? _error;

  List<ForumQuestion> _all = [];
  List<ForumQuestion> _mine = [];
  List<ForumQuestion> _pending = [];
  List<ForumQuestion> _answered = [];

  bool get _isProf => context.read<AuthState>().isProfessor;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: _isProf ? 3 : 2, vsync: this);
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _all = await _service.list();
      if (_isProf) {
        _pending = await _service.professorPending();
        _answered = await _service.professorAnswered();
      } else {
        _mine = await _service.myQuestions();
      }
    } catch (e) {
      _error = 'Não foi possível carregar o fórum.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          SizedBox(
            height: 56,
            child: AnimatedBuilder(
              animation: _tab,
              builder: (_, __) {
                final labels = _isProf
                    ? const ['Todas', 'Pendentes', 'Respondidas']
                    : const ['Todas', 'Minhas'];
                return ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  itemCount: labels.length,
                  itemBuilder: (_, i) => Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: NeuChip(
                      label: labels[i],
                      selected: _tab.index == i,
                      onTap: () => _tab.animateTo(i),
                    ),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : TabBarView(
                        controller: _tab,
                        children: _isProf
                            ? [_list(_all), _list(_pending), _list(_answered)]
                            : [_list(_all), _list(_mine)],
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: SaeColors.primary,
        foregroundColor: Colors.white,
        onPressed: () async {
          final created = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const NewQuestionPage()),
          );
          if (created == true) _load();
        },
        icon: const Icon(Icons.add),
        label: const Text('Nova'),
      ),
    );
  }

  Widget _list(List<ForumQuestion> items) {
    if (items.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [SizedBox(height: 120), Center(child: Text('Sem perguntas.'))],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) => _QuestionTile(
          q: items[i],
          onTap: () async {
            await Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => QuestionDetailPage(questionId: items[i].id),
            ));
            _load();
          },
        ),
      ),
    );
  }
}

class _QuestionTile extends StatelessWidget {
  final ForumQuestion q;
  final VoidCallback onTap;
  const _QuestionTile({required this.q, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colorByStatus = (q.status ?? '').toUpperCase() == 'RESPONDIDA'
        ? SaeColors.primary
        : Colors.orange;
    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: SaeColors.primary.withValues(alpha: 0.12),
          child: const Icon(Icons.help_outline, color: SaeColors.primary),
        ),
        title: Text(
          q.titulo,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              if (q.questionType != null)
                _badge(q.questionType!, SaeColors.secondary),
              if (q.disciplina != null) _badge(q.disciplina!, SaeColors.primary.withValues(alpha: 0.8)),
              if (q.status != null) _badge(q.status!, colorByStatus),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }

  Widget _badge(String text, Color c) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(20)),
        child: Text(text,
            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
      );
}
