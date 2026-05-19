import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../services/ai_service.dart';
import '../services/content_service.dart';
import '../theme.dart';
import '../widgets/neumorphic.dart';

class _Msg {
  final String text;
  final bool isBot;
  _Msg(this.text, this.isBot);
}

class ChatIaPage extends StatefulWidget {
  const ChatIaPage({super.key});
  @override
  State<ChatIaPage> createState() => _ChatIaPageState();
}

class _ChatIaPageState extends State<ChatIaPage> {
  final _ai = AiService();
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<_Msg> _msgs = [];
  bool _loadingHistory = true;
  bool _sending = false;

  // Contexto do livro seleccionado (vai no campo `subject` da API).
  Content? _book;
  // Ficheiro anexado (apenas o nome é referido na mensagem; o conteúdo
  // do ficheiro fica em cache local — o AI service usa apenas o texto).
  PlatformFile? _file;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final h = await _ai.history();
    if (!mounted) return;
    setState(() {
      _loadingHistory = false;
      _msgs.clear();
      for (final m in h) {
        _msgs.add(_Msg(m.content, m.role == 'assistant'));
      }
      if (_msgs.isEmpty) {
        _msgs.add(_Msg(
          'Olá! Sou o assistente SAE. Posso ajudar a estudar, explicar capítulos, responder dúvidas. Anexe um livro da biblioteca ou um ficheiro e diga-me em que posso ajudar.',
          true,
        ));
      }
    });
    _scrollDown();
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String? _buildSubject() {
    if (_book == null && _file == null) return null;
    final parts = <String>[];
    if (_book != null) {
      parts.add('Livro: ${_book!.title}');
      if (_book!.discipline != null) parts.add('Disciplina: ${_book!.discipline}');
      if (_book!.totalPages != null) parts.add('Páginas: ${_book!.totalPages}');
    }
    if (_file != null) parts.add('Ficheiro anexo: ${_file!.name}');
    return parts.join(' · ');
  }

  Future<void> _send([String? overrideText]) async {
    final text = (overrideText ?? _ctrl.text).trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _msgs.add(_Msg(text, false));
      _sending = true;
      _ctrl.clear();
    });
    _scrollDown();
    try {
      final response = await _ai.chat(message: text, subject: _buildSubject());
      if (!mounted) return;
      setState(() => _msgs.add(_Msg(response, true)));
    } catch (e) {
      if (!mounted) return;
      setState(() => _msgs.add(_Msg(
            'Não consegui contactar o assistente IA. Verifique a ligação ao sae-ai-service (porta 8000).',
            true,
          )));
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollDown();
    }
  }

  Future<void> _pickBook() async {
    final book = await Navigator.of(context).push<Content>(
      MaterialPageRoute(builder: (_) => const _LibraryPickerPage()),
    );
    if (book != null) setState(() => _book = book);
  }

  Future<void> _pickFile() async {
    final res = await FilePicker.platform.pickFiles();
    if (res != null && res.files.isNotEmpty) {
      setState(() => _file = res.files.first);
    }
  }

  Future<void> _clearChat() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Limpar conversa?'),
        content: const Text('O histórico desta sessão será apagado.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Limpar')),
        ],
      ),
    );
    if (ok != true) return;
    await _ai.clearHistory();
    if (!mounted) return;
    setState(_msgs.clear);
    _msgs.add(_Msg('Histórico limpo. Em que posso ajudar agora?', true));
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      body: Column(
        children: [
          if (_book != null || _file != null) _contextBar(),
          Expanded(child: _loadingHistory ? _loadingView() : _messages()),
          _composer(),
        ],
      ),
    );
  }

  Widget _loadingView() => const Center(child: CircularProgressIndicator());

  Widget _messages() {
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      itemCount: _msgs.length + (_sending ? 1 : 0),
      itemBuilder: (_, i) {
        if (_sending && i == _msgs.length) return _typingBubble();
        final m = _msgs[i];
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment:
                m.isBot ? MainAxisAlignment.start : MainAxisAlignment.end,
            children: [
              if (m.isBot) _botAvatar(),
              if (m.isBot) const SizedBox(width: 8),
              Flexible(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.72,
                  ),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: m.isBot ? Neu.surface : SaeColors.primary,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(m.isBot ? 4 : 16),
                      bottomRight: Radius.circular(m.isBot ? 16 : 4),
                    ),
                    boxShadow: m.isBot ? Neu.outsetTight : null,
                  ),
                  child: SelectableText(
                    m.text,
                    style: TextStyle(
                      color: m.isBot ? SaeColors.textPrimary : Colors.white,
                      height: 1.35,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              if (!m.isBot) const SizedBox(width: 8),
              if (!m.isBot)
                const CircleAvatar(
                  radius: 16,
                  backgroundColor: SaeColors.secondary,
                  child: Icon(Icons.person, color: Colors.white, size: 16),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _botAvatar() => Container(
        width: 32, height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2BB36F), Color(0xFF008F44)],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
      );

  Widget _typingBubble() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        _botAvatar(),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: Neu.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: Neu.outsetTight,
          ),
          child: const SizedBox(
            width: 22, height: 14,
            child: _TypingDots(),
          ),
        ),
      ]),
    );
  }

  Widget _contextBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: Wrap(
        spacing: 6, runSpacing: 6,
        children: [
          if (_book != null)
            _ContextChip(
              icon: Icons.menu_book,
              label: _book!.title,
              onRemove: () => setState(() => _book = null),
            ),
          if (_file != null)
            _ContextChip(
              icon: Icons.attach_file,
              label: _file!.name,
              onRemove: () => setState(() => _file = null),
            ),
          if (_book != null)
            _QuickPromptChip(
              icon: Icons.list_alt,
              label: 'Explicar capítulos',
              onTap: () => _send('Explica os capítulos do livro "${_book!.title}" em pontos curtos.'),
            ),
          if (_book != null)
            _QuickPromptChip(
              icon: Icons.lightbulb_outline,
              label: 'Resumo',
              onTap: () => _send('Faz um resumo do livro "${_book!.title}".'),
            ),
          if (_book != null)
            _QuickPromptChip(
              icon: Icons.help_outline,
              label: 'Gera quiz',
              onTap: () => _send('Cria 5 perguntas de escolha múltipla baseadas em "${_book!.title}".'),
            ),
        ],
      ),
    );
  }

  Widget _composer() {
    return SafeArea(
      top: false,
      child: Container(
        decoration: BoxDecoration(
          color: Neu.surface,
          border: Border(top: BorderSide(color: Colors.black.withValues(alpha: 0.06))),
        ),
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
        child: Row(children: [
          _composerIcon(Icons.menu_book, 'Anexar livro', _pickBook),
          _composerIcon(Icons.attach_file, 'Anexar ficheiro', _pickFile),
          _composerIcon(Icons.delete_outline, 'Limpar', _clearChat),
          Expanded(
            child: TextField(
              controller: _ctrl,
              minLines: 1, maxLines: 4,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
              decoration: const InputDecoration(
                hintText: 'Pergunte algo ao assistente...',
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 4),
          Material(
            color: _sending ? const Color(0xFFBCC9C5) : SaeColors.primary,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: _sending ? null : () => _send(),
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _composerIcon(IconData icon, String tooltip, VoidCallback onTap) {
    return IconButton(
      tooltip: tooltip,
      icon: Icon(icon, color: SaeColors.textSecondary, size: 22),
      onPressed: onTap,
    );
  }
}

class _ContextChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onRemove;
  const _ContextChip({required this.icon, required this.label, required this.onRemove});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 6, 6, 6),
      decoration: BoxDecoration(
        color: SaeColors.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: SaeColors.primary.withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: SaeColors.primary, size: 14),
        const SizedBox(width: 6),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 180),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: SaeColors.primary,
                fontWeight: FontWeight.w700, fontSize: 12),
          ),
        ),
        IconButton(
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
          icon: const Icon(Icons.close, size: 14, color: SaeColors.primary),
          onPressed: onRemove,
        ),
      ]),
    );
  }
}

class _QuickPromptChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickPromptChip({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Neu.surface,
            borderRadius: BorderRadius.circular(20),
            boxShadow: Neu.outsetTight,
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 14, color: SaeColors.secondary),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                  color: SaeColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 12),
            ),
          ]),
        ),
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  const _TypingDots();
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) => Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (i) {
          final t = ((_c.value * 3) - i).clamp(0.0, 1.0);
          final scale = 0.6 + (t < 0.5 ? t : 1 - t) * 0.8;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Transform.scale(
              scale: scale,
              child: Container(
                width: 6, height: 6,
                decoration: const BoxDecoration(
                  color: SaeColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

/// Picker de livro da biblioteca; devolve `Content` ao chamador.
class _LibraryPickerPage extends StatefulWidget {
  const _LibraryPickerPage();
  @override
  State<_LibraryPickerPage> createState() => _LibraryPickerPageState();
}

class _LibraryPickerPageState extends State<_LibraryPickerPage> {
  final _service = ContentService();
  final _ctrl = TextEditingController();
  List<Content> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final q = _ctrl.text.trim();
      _items = q.isEmpty ? await _service.listContents() : await _service.search(q);
    } catch (_) {
      _items = [];
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      appBar: AppBar(title: const Text('Escolher livro')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 4),
          child: NeuTextField(
            controller: _ctrl,
            hintText: 'Pesquisar...',
            prefixIcon: Icons.search,
            onSubmitted: (_) => _load(),
            onChanged: (_) => setState(() {}),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _items.isEmpty
                  ? const Center(child: Text('Sem resultados.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(12),
                      itemCount: _items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final c = _items[i];
                        final thumb = _service.absoluteUrl(c.thumbnailUrl);
                        return NeuCard(
                          padding: const EdgeInsets.all(10),
                          onTap: () => Navigator.of(context).pop(c),
                          child: Row(children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: SizedBox(
                                width: 44, height: 60,
                                child: thumb == null
                                    ? Container(
                                        color: const Color(0xFFE6ECEA),
                                        alignment: Alignment.center,
                                        child: const Icon(Icons.menu_book,
                                            color: SaeColors.primary,
                                            size: 18),
                                      )
                                    : CachedNetworkImage(
                                        imageUrl: thumb, fit: BoxFit.cover),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800)),
                                  const SizedBox(height: 4),
                                  Text(
                                    [c.discipline, c.level]
                                        .where((e) => e != null && e.isNotEmpty)
                                        .join(' · '),
                                    style: const TextStyle(
                                        color: SaeColors.textSecondary,
                                        fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.add_circle_outline,
                                color: SaeColors.primary),
                          ]),
                        );
                      },
                    ),
        ),
      ]),
    );
  }
}
