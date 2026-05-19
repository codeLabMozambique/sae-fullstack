import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/content_service.dart';
import '../../services/forum_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../file_viewer_page.dart';

class QuestionDetailPage extends StatefulWidget {
  final int questionId;
  const QuestionDetailPage({super.key, required this.questionId});
  @override
  State<QuestionDetailPage> createState() => _QuestionDetailPageState();
}

class _QuestionDetailPageState extends State<QuestionDetailPage> {
  final _service = ForumService();
  final _attachments = ContentService();
  final _answerCtrl = TextEditingController();
  QuestionDetail? _detail;
  bool _loading = true;
  bool _sending = false;
  String? _error;
  PlatformFile? _file;

  Future<void> _pick() async {
    final res = await FilePicker.platform.pickFiles();
    if (res != null && res.files.isNotEmpty) {
      setState(() => _file = res.files.first);
    }
  }

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
      String? attachmentId;
      if (_file?.path != null) {
        final att = await _attachments.uploadAttachment(
          _file!.path!,
          fileName: _file!.name,
          context: 'forum',
          contextId: _detail!.question.id.toString(),
        );
        attachmentId = att.id;
      }
      final auth = context.read<AuthState>();
      final isCollab = (_detail!.question.questionType ?? '').toUpperCase() == 'COLABORATIVO';
      if (auth.isProfessor && !isCollab) {
        await _service.answerExpert(_detail!.question.id, text, attachmentId: attachmentId);
      } else {
        await _service.answerCollaborative(_detail!.question.id, text, attachmentId: attachmentId);
      }
      _answerCtrl.clear();
      _file = null;
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao enviar resposta.')),
        );
      }
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
                          color: SaeColors.bg,
                          border: Border(top: BorderSide(color: Colors.black.withValues(alpha: 0.06))),
                        ),
                        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_file != null)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(children: [
                                  const Icon(Icons.attach_file,
                                      size: 16, color: SaeColors.primary),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(_file!.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 12)),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close, size: 16),
                                    onPressed: () => setState(() => _file = null),
                                  ),
                                ]),
                              ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.attach_file),
                                  color: SaeColors.textSecondary,
                                  onPressed: _pick,
                                ),
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
        if (q.attachmentId != null) ...[
          const SizedBox(height: 8),
          _AttachmentChip(attachmentId: q.attachmentId!),
        ],
        const SizedBox(height: 6),
        Text('por ${q.autorNome ?? q.autorUsername ?? '-'}',
            style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
        const SizedBox(height: 12),
        if (auth.isStudent && _showAiButton()) _aiHelpCard(),
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
            if (a.attachmentId != null) ...[
              const SizedBox(height: 6),
              _AttachmentChip(attachmentId: a.attachmentId!),
            ],
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

  bool _requestingAi = false;

  /// Mostra o botão de assistente IA apenas se a pergunta é especialista
  /// e ainda não tem resposta de professor aceite.
  bool _showAiButton() {
    if (_detail == null) return false;
    final isExpert = (_detail!.question.questionType ?? '').toUpperCase() == 'ESPECIALIZADO';
    final hasAccepted = _detail!.expertAnswers.any((a) => a.aceita);
    return isExpert && !hasAccepted;
  }

  Future<void> _askAi() async {
    if (_detail == null) return;
    setState(() => _requestingAi = true);
    try {
      await _service.requestAIAnswer(_detail!.question.id);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Resposta do assistente IA gerada.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Não foi possível obter resposta da IA.')),
        );
      }
    } finally {
      if (mounted) setState(() => _requestingAi = false);
    }
  }

  Widget _aiHelpCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            SaeColors.primary.withValues(alpha: 0.10),
            const Color(0xFFFFA000).withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SaeColors.primary.withValues(alpha: 0.25)),
      ),
      child: Row(children: [
        Container(
          width: 38, height: 38,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2BB36F), Color(0xFF008F44)],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Sem professor disponível?',
                  style: TextStyle(fontWeight: FontWeight.w800)),
              SizedBox(height: 2),
              Text(
                'Peça uma resposta inicial ao assistente IA enquanto aguarda.',
                style: TextStyle(
                    color: SaeColors.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton.icon(
          onPressed: _requestingAi ? null : _askAi,
          style: ElevatedButton.styleFrom(
            backgroundColor: SaeColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
          icon: _requestingAi
              ? const SizedBox(
                  width: 14, height: 14,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.bolt, size: 16),
          label: const Text('Pedir IA',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
        ),
      ]),
    );
  }

  Widget _badge(String text, Color c) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(20)),
        child: Text(text,
            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
      );
}

class _AttachmentChip extends StatelessWidget {
  final String attachmentId;
  const _AttachmentChip({required this.attachmentId});
  @override
  Widget build(BuildContext context) {
    final url = ContentService().attachmentUrl(attachmentId);
    return Align(
      alignment: Alignment.centerLeft,
      child: Material(
        color: SaeColors.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => FileViewerPage(url: url, title: 'Anexo'),
          )),
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.attach_file, size: 14, color: SaeColors.primary),
              SizedBox(width: 6),
              Text('Ver anexo',
                  style: TextStyle(
                      color: SaeColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12)),
            ]),
          ),
        ),
      ),
    );
  }
}
