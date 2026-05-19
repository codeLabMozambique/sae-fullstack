import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/content_service.dart';
import '../../services/offline_service.dart';
import '../../theme.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/neumorphic.dart';
import 'leitor_page.dart';

class OfflinePage extends StatefulWidget {
  const OfflinePage({super.key});
  @override
  State<OfflinePage> createState() => _OfflinePageState();
}

class _OfflinePageState extends State<OfflinePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await OfflineService.instance.ensureInit();
      if (mounted) setState(() {});
    });
  }

  String _human(int bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    double v = bytes.toDouble();
    var i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return '${v.toStringAsFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}';
  }

  @override
  Widget build(BuildContext context) {
    final offline = context.watch<OfflineService>();
    final content = ContentService();
    final books = offline.books;
    final total = offline.totalBytes();

    return Scaffold(
      backgroundColor: SaeColors.bg,
      body: books.isEmpty
          ? const EmptyState(
              icon: Icons.cloud_download_outlined,
              title: 'Sem livros guardados offline',
              subtitle: 'Abra um livro na biblioteca e use o ícone de download.',
            )
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
                  child: NeuCard(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(children: [
                      const Icon(Icons.storage, color: SaeColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          '${books.length} livros · ${_human(total)} usados',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.delete_sweep_outlined,
                            color: SaeColors.error),
                        label: const Text('Limpar tudo',
                            style: TextStyle(color: SaeColors.error)),
                        onPressed: () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: const Text('Limpar livros offline?'),
                              content: const Text(
                                  'Vai remover todos os livros descarregados. Continuar?'),
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
                          if (ok == true) await offline.clearAllBooks();
                        },
                      ),
                    ]),
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () async => setState(() {}),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(14),
                      itemCount: books.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final b = books[i];
                        final thumb = content.absoluteUrl(b.thumbnailUrl);
                        return Dismissible(
                          key: ValueKey(b.contentId),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.symmetric(horizontal: 22),
                            decoration: BoxDecoration(
                              color: SaeColors.error,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.delete, color: Colors.white),
                          ),
                          onDismissed: (_) => offline.removeBook(b.contentId),
                          child: NeuCard(
                            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => LeitorPage(
                                content: Content(
                                  id: b.contentId,
                                  title: b.title,
                                  discipline: b.discipline,
                                  thumbnailUrl: b.thumbnailUrl,
                                ),
                              ),
                            )),
                            child: Row(children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: SizedBox(
                                  width: 56, height: 76,
                                  child: thumb == null
                                      ? Container(
                                          color: const Color(0xFFE6ECEA),
                                          child: const Icon(Icons.menu_book,
                                              color: SaeColors.primary))
                                      : CachedNetworkImage(
                                          imageUrl: thumb, fit: BoxFit.cover),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(b.title,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w800)),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        b.discipline ?? '',
                                        _human(b.sizeBytes),
                                        DateFormat('dd/MM/yyyy').format(b.downloadedAt),
                                      ].where((s) => s.isNotEmpty).join(' · '),
                                      style: const TextStyle(
                                          color: SaeColors.textSecondary, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.offline_pin,
                                  color: SaeColors.primary),
                            ]),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
