import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../services/content_service.dart';
import '../../services/forum_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_tokens.dart';
import '../file_viewer_page.dart';

/// Thread estilo chat — pergunta em destaque, respostas em cartões,
/// resposta de professor com banner verde.
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
  bool _requestingAi = false;
  String? _error;
  PlatformFile? _file;

  @override
  void initState() {
    super.initState();
    _load();
  }

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
    } catch (_) {
      _error = 'Não foi possível carregar.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
          const SnackBar(content: Text('Resposta da IA gerada.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível obter resposta da IA.')),
        );
      }
    } finally {
      if (mounted) setState(() => _requestingAi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Pergunta'),
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : Column(
                  children: [
                    Expanded(child: _content()),
                    _Composer(
                      controller: _answerCtrl,
                      sending: _sending,
                      file: _file,
                      onPick: _pick,
                      onClearFile: () => setState(() => _file = null),
                      onSend: _sendAnswer,
                    ),
                  ],
                ),
    );
  }

  Widget _content() {
    final q = _detail!.question;
    final auth = context.read<AuthState>();
    final answers = [
      ..._detail!.expertAnswers.map((a) => (a: a, expert: true)),
      ..._detail!.collaborativeAnswers.map((a) => (a: a, expert: false)),
    ];

    final discStyle = Disciplines.of(q.disciplina);

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
      children: [
        // Pergunta
        Wrap(spacing: 6, runSpacing: 4, children: [
          if (q.disciplina != null)
            SaePill(q.disciplina!, color: discStyle.chipFg, bg: discStyle.chipBg),
          if (q.questionType != null)
            SaePill(q.questionType!.toLowerCase() == 'colaborativo' ? 'Colaborativa' : 'Especialista',
              color: SaeColors.ink2, bg: SaeColors.line2,
              icon: q.questionType!.toLowerCase() == 'colaborativo'
                  ? LucideIcons.users : LucideIcons.shieldCheck,
            ),
          if ((q.status ?? '').toUpperCase() == 'RESPONDIDA')
            SaePill.success('Respondida', icon: LucideIcons.check)
          else
            SaePill.warn('A aguardar'),
        ]),
        const SizedBox(height: 12),
        Text(q.titulo, style: const TextStyle(
          fontSize: 20, fontWeight: FontWeight.w800,
          color: SaeColors.textPrimary, height: 1.25, letterSpacing: -0.5,
        )),
        const SizedBox(height: 14),
        Row(children: [
          SaeAvatar(name: q.autorNome ?? q.autorUsername ?? '?', size: 36),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(q.autorNome ?? q.autorUsername ?? '-',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
                Text(_relative(q.createdAt) ?? '',
                  style: const TextStyle(fontSize: 11, color: SaeColors.textSecondary),
                ),
              ],
            ),
          ),
        ]),
        if (q.descricao != null && q.descricao!.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(q.descricao!, style: const TextStyle(
            fontSize: 14, color: SaeColors.ink2, height: 1.55,
          )),
        ],
        if (q.attachmentId != null) ...[
          const SizedBox(height: 10),
          _AttachmentChip(attachmentId: q.attachmentId!),
        ],

        if (auth.isStudent && _showAiButton()) ...[
          const SizedBox(height: 16),
          _AiHelpCard(loading: _requestingAi, onTap: _askAi),
        ],

        const SizedBox(height: 18),

        // Header de respostas
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: SaeColors.bg,
          margin: const EdgeInsets.symmetric(horizontal: -18),
          child: Text(
            answers.isEmpty
              ? 'SEM RESPOSTAS AINDA'
              : '${answers.length} RESPOSTA${answers.length == 1 ? "" : "S"}',
            style: const TextStyle(
              fontSize: 11, fontWeight: FontWeight.w800,
              color: SaeColors.textSecondary, letterSpacing: 1,
            ),
          ),
        ),
        const SizedBox(height: 12),

        if (answers.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: SaeEmpty(
              icon: LucideIcons.messageCircle,
              title: 'Sê o primeiro a responder',
              subtitle: 'Escreve uma resposta no campo abaixo.',
            ),
          )
        else
          ...answers.map((r) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _AnswerBubble(
              a: r.a, expert: r.expert,
              canAccept: auth.isStudent && r.expert,
              onAccept: r.a.aceita ? null : () async {
                try {
                  await _service.accept(r.a.id);
                  _load();
                } catch (_) {}
              },
            ),
          )),
      ],
    );
  }

  String? _relative(String? iso) {
    if (iso == null) return null;
    try {
      final d = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(d);
      if (diff.inMinutes < 60) return 'há ${diff.inMinutes} min';
      if (diff.inHours < 24)   return 'há ${diff.inHours} h';
      if (diff.inDays  < 7)    return 'há ${diff.inDays} dia${diff.inDays == 1 ? "" : "s"}';
      return DateFormat('dd MMM yyyy').format(d);
    } catch (_) { return null; }
  }
}

/// ─── AI help card ─────────────────────────────────────────────────────────
class _AiHelpCard extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  const _AiHelpCard({required this.loading, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            SaeColors.primary.withValues(alpha: 0.10),
            const Color(0xFFFFA000).withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SaeColors.primary.withValues(alpha: 0.25)),
      ),
      child: Row(children: [
        Container(
          width: 40, height: 40, alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2BB36F), Color(0xFF008F44)],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 18),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Sem professor disponível?',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
              SizedBox(height: 2),
              Text('Pede uma resposta inicial à IA enquanto aguardas.',
                style: TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton.icon(
          onPressed: loading ? null : onTap,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            minimumSize: const Size(0, 38),
          ),
          icon: loading
            ? const SizedBox(width: 14, height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(LucideIcons.zap, size: 14),
          label: const Text('Pedir IA',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
          ),
        ),
      ]),
    );
  }
}

/// ─── Answer bubble ────────────────────────────────────────────────────────
class _AnswerBubble extends StatelessWidget {
  final ForumAnswer a;
  final bool expert;
  final bool canAccept;
  final VoidCallback? onAccept;
  const _AnswerBubble({
    required this.a, required this.expert,
    required this.canAccept, this.onAccept,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: expert ? SaeColors.primarySofter : SaeColors.bg,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(14), topRight: Radius.circular(14),
          bottomRight: Radius.circular(14), bottomLeft: Radius.circular(4),
        ),
        border: Border.all(
          color: expert ? SaeColors.primarySoft : SaeColors.line,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SaeAvatar(name: a.autorNome ?? a.autorUsername ?? '?',
            color: expert ? SaeColors.primary : SaeColors.secondary,
            size: 36,
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(a.autorNome ?? a.autorUsername ?? '-',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 6),
                    if (expert)
                      SaePill('PROFESSOR',
                        color: Colors.white, bg: SaeColors.primary,
                        fontSize: 9,
                      ),
                    if (a.aceita) ...[
                      const SizedBox(width: 6),
                      SaePill.success('Aceite', icon: LucideIcons.check),
                    ],
                  ],
                ),
                if (a.createdAt != null)
                  Text(_relative(a.createdAt!),
                    style: const TextStyle(fontSize: 10.5, color: SaeColors.textSecondary),
                  ),
                const SizedBox(height: 6),
                if (a.texto != null)
                  Text(a.texto!, style: const TextStyle(
                    fontSize: 13.5, height: 1.55, color: SaeColors.ink2,
                  )),
                if (a.attachmentId != null) ...[
                  const SizedBox(height: 8),
                  _AttachmentChip(attachmentId: a.attachmentId!),
                ],
                if (canAccept && !a.aceita) ...[
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: onAccept,
                      icon: const Icon(LucideIcons.check, size: 14),
                      label: const Text('Aceitar como resposta',
                          style: TextStyle(fontSize: 12)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _relative(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(d);
      if (diff.inMinutes < 60) return 'há ${diff.inMinutes} min';
      if (diff.inHours < 24)   return 'há ${diff.inHours} h';
      return 'há ${diff.inDays} dia${diff.inDays == 1 ? "" : "s"}';
    } catch (_) { return ''; }
  }
}

/// ─── Composer ─────────────────────────────────────────────────────────────
class _Composer extends StatelessWidget {
  final TextEditingController controller;
  final bool sending;
  final PlatformFile? file;
  final VoidCallback onPick;
  final VoidCallback onClearFile;
  final VoidCallback onSend;
  const _Composer({
    required this.controller,
    required this.sending,
    required this.file,
    required this.onPick,
    required this.onClearFile,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: SaeColors.line)),
        ),
        padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (file != null)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: SaeColors.primarySofter,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: SaeColors.primarySoft),
                ),
                child: Row(children: [
                  const Icon(LucideIcons.paperclip, size: 14, color: SaeColors.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(file!.name,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                  InkWell(
                    onTap: onClearFile,
                    borderRadius: BorderRadius.circular(999),
                    child: const Padding(
                      padding: EdgeInsets.all(2),
                      child: Icon(LucideIcons.x, size: 14, color: SaeColors.textSecondary),
                    ),
                  ),
                ]),
              ),
            Container(
              decoration: BoxDecoration(
                color: SaeColors.bg,
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.paperclip, size: 19),
                    color: SaeColors.textSecondary,
                    onPressed: onPick,
                  ),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      minLines: 1, maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Escreve a tua resposta…',
                        border: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        filled: false,
                        isCollapsed: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                      style: const TextStyle(fontSize: 13.5),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Material(
                    color: sending ? SaeColors.textMuted : SaeColors.primary,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: sending ? null : onSend,
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: sending
                          ? const SizedBox(width: 14, height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                          : const Icon(LucideIcons.send,
                              color: Colors.white, size: 16),
                      ),
                    ),
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

/// ─── Attachment chip ──────────────────────────────────────────────────────
class _AttachmentChip extends StatelessWidget {
  final String attachmentId;
  const _AttachmentChip({required this.attachmentId});
  @override
  Widget build(BuildContext context) {
    final url = ContentService().attachmentUrl(attachmentId);
    return Align(
      alignment: Alignment.centerLeft,
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => FileViewerPage(url: url, title: 'Anexo'),
        )),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: SaeColors.primarySoft,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(LucideIcons.paperclip, size: 13, color: SaeColors.primaryDark),
            SizedBox(width: 6),
            Text('Ver anexo', style: TextStyle(
              color: SaeColors.primaryDark,
              fontWeight: FontWeight.w800, fontSize: 12,
            )),
          ]),
        ),
      ),
    );
  }
}
