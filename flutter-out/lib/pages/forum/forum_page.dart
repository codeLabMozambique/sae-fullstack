import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../services/forum_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_skeleton.dart';
import '../../widgets/sae_tokens.dart';
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
    setState(() { _loading = true; _error = null; });
    try {
      _all = await _service.list();
      if (_isProf) {
        _pending  = await _service.professorPending();
        _answered = await _service.professorAnswered();
      } else {
        _mine = await _service.myQuestions();
      }
    } catch (_) {
      _error = 'Não foi possível carregar o fórum.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final labels = _isProf
        ? const ['Todas', 'Pendentes', 'Respondidas']
        : const ['Todas', 'As minhas'];
    return Scaffold(
      backgroundColor: SaeColors.bg,
      body: Column(
        children: [
          AnimatedBuilder(
            animation: _tab,
            builder: (_, __) => SaeChipRow(
              items: labels,
              active: labels[_tab.index],
              onPick: (l) => _tab.animateTo(labels.indexOf(l)),
              dark: true,
            ),
          ),
          Expanded(
            child: _loading
                ? _LoadingList()
                : _error != null
                    ? SaeEmpty(
                        icon: LucideIcons.wifiOff, title: _error!,
                        action: OutlinedButton(onPressed: _load,
                            child: const Text('Tentar novamente')),
                      )
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
        onPressed: () async {
          final ok = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const NewQuestionPage()),
          );
          if (ok == true) _load();
        },
        icon: const Icon(LucideIcons.plus),
        label: const Text('Nova'),
      ),
    );
  }

  Widget _list(List<ForumQuestion> items) {
    if (items.isEmpty) {
      return RefreshIndicator(
        color: SaeColors.primary,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 60),
            SaeEmpty(
              icon: LucideIcons.messageCircle,
              title: 'Sem perguntas por aqui',
              subtitle: 'Cria uma nova pergunta para começar.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: SaeColors.primary,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 100),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
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
    final status = (q.status ?? '').toUpperCase();
    final answered = status == 'RESPONDIDA';
    final discStyle = Disciplines.of(q.disciplina);
    final isExpert = (q.questionType ?? '').toUpperCase() == 'ESPECIALIZADO';

    String when = '';
    if (q.createdAt != null) {
      try {
        final d = DateTime.parse(q.createdAt!).toLocal();
        final diff = DateTime.now().difference(d);
        if (diff.inMinutes < 60) {
          when = '${diff.inMinutes} min';
        } else if (diff.inHours < 24) {
          when = '${diff.inHours}h';
        } else if (diff.inDays < 7) {
          when = '${diff.inDays} dia${diff.inDays == 1 ? "" : "s"}';
        } else {
          when = DateFormat('dd MMM').format(d);
        }
      } catch (_) {}
    }

    return SaeCard(
      onTap: onTap,
      padding: const EdgeInsets.all(13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (q.disciplina != null) ...[
                SaePill(q.disciplina!, color: discStyle.chipFg, bg: discStyle.chipBg),
                const SizedBox(width: 6),
              ],
              SaePill(isExpert ? 'Especialista' : 'Colaborativa',
                color: isExpert ? const Color(0xFF1E3A8A) : SaeColors.ink2,
                bg: isExpert ? SaeColors.infoSoft : SaeColors.line2,
                icon: isExpert ? LucideIcons.shieldCheck : LucideIcons.users,
              ),
              const Spacer(),
              if (answered)
                const Icon(LucideIcons.checkCircle2, size: 14, color: SaeColors.primary)
              else
                Container(
                  width: 8, height: 8,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle, color: SaeColors.warn,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(q.titulo,
            maxLines: 2, overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w700,
              color: SaeColors.textPrimary, height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          Row(children: [
            SaeAvatar(name: q.autorNome ?? q.autorUsername ?? '?',
                color: SaeColors.secondary, size: 22),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${q.autorNome ?? q.autorUsername ?? "—"}${when.isEmpty ? "" : " · $when"}',
                style: const TextStyle(
                  fontSize: 11.5, color: SaeColors.textSecondary,
                ),
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 14, color: SaeColors.textMuted),
          ]),
        ],
      ),
    );
  }
}

class _LoadingList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 20),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => const SaeSkeletonCard(),
    );
  }
}
