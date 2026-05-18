import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/forum_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';

class QuestionDetailPage extends StatefulWidget {
  final int questionId;
  const QuestionDetailPage({super.key, required this.questionId});
  @override
  State<QuestionDetailPage> createState() => _QuestionDetailPageState();
}

class _QuestionDetailPageState extends State<QuestionDetailPage> {
  final _service = ForumService();
  final _answerCtrl = TextEditingController();
  QuestionDetail? _detail;
  bool _loading = true;
  bool _sending = false;
  String? _error;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _detail = await _service.get(widget.questionId);
      _error = null;
    } catch (e) {
      _error = 'Não foi possível carregar.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _sendAnswer() async {
    final text = _answerCtrl.text.trim();
    if (text.isEmpty || _detail == null) return;
    setState(() => _sending = true);
    try {
      final auth = context.read<AuthState>();
      final isCollab = (_detail!.question.questionType ?? '').toUpperCase() == 'COLABORATIVO';
      if (auth.isProfessor && !isCollab) {
        await _service.answerExpert(_detail!.question.id, text);
      } else {
        await _service.answerCollaborative(_detail!.question.id, text);
      }
      _answerCtrl.clear();
      await _load();
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao enviar resposta.')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pergunta')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : Column(
                  children: [
                    Expanded(child: _content()),
                    SafeArea(
                      top: false,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border(top: BorderSide(color: Colors.black.withValues(alpha: 0.06))),
                        ),
                        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _answerCtrl,
                                minLines: 1,
                                maxLines: 4,
                                decoration: const InputDecoration(
                                  hintText: 'Escrever resposta...',
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton.filled(
                              style: IconButton.styleFrom(backgroundColor: SaeColors.primary),
                              onPressed: _sending ? null : _sendAnswer,
                              icon: const Icon(Icons.send, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _content() {
    final q = _detail!.question;
    final auth = context.read<AuthState>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(q.titulo, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Wrap(spacing: 6, children: [
          if (q.questionType != null) _badge(q.questionType!, SaeColors.secondary),
          if (q.disciplina != null) _badge(q.disciplina!, SaeColors.primary),
          if (q.status != null) _badge(q.status!, Colors.orange),
        ]),
        const SizedBox(height: 12),
        Text(q.descricao ?? '', style: const TextStyle(color: SaeColors.textPrimary)),
        const SizedBox(height: 6),
        Text('por ${q.autorNome ?? q.autorUsername ?? '-'}',
            style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
        const Divider(height: 32),
        if (_detail!.expertAnswers.isNotEmpty) ...[
          const Text('Respostas de especialistas',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ..._detail!.expertAnswers.map((a) => _answerCard(a, expert: true, canAccept: auth.isStudent)),
          const SizedBox(height: 12),
        ],
        if (_detail!.collaborativeAnswers.isNotEmpty) ...[
          const Text('Respostas colaborativas',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ..._detail!.collaborativeAnswers.map((a) => _answerCard(a, expert: false)),
        ],
        if (_detail!.expertAnswers.isEmpty && _detail!.collaborativeAnswers.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: Text('Sem respostas ainda.')),
          ),
      ],
    );
  }

  Widget _answerCard(ForumAnswer a, {required bool expert, bool canAccept = false}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(expert ? Icons.verified : Icons.group,
                    size: 18, color: expert ? SaeColors.primary : SaeColors.secondary),
                const SizedBox(width: 6),
                Text(a.autorNome ?? a.autorUsername ?? '-',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                const Spacer(),
                if (a.aceita)
                  _badge('Aceite', SaeColors.primary),
              ],
            ),
            const SizedBox(height: 6),
            Text(a.texto ?? ''),
            if (expert && canAccept && !a.aceita) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () async {
                    try {
                      await _service.accept(a.id);
                      _load();
                    } catch (_) {}
                  },
                  icon: const Icon(Icons.check),
                  label: const Text('Aceitar'),
                ),
              ),
            ],
          ],
        ),
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
