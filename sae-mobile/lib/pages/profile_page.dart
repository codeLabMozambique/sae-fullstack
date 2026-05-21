import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/connectivity_service.dart';
import '../services/offline_service.dart';
import '../services/user_service.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/neumorphic.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});
  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _userService = UserService();
  MyProfile? _me;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthState>();
    if (auth.isGuestRole) {
      setState(() => _loading = false);
      return;
    }
    final m = await _userService.me();
    if (!mounted) return;
    setState(() {
      _me = m;
      _loading = false;
    });
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return '?';
    final first = parts.first[0];
    final last = parts.length > 1 ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }

  String _roleLabel(AuthState a) {
    if (a.isGuestRole) return 'Visitante';
    if (a.isProfessor) return 'Professor';
    if (a.isStudent) return 'Aluno';
    return a.user?.role ?? '';
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
    final auth = context.watch<AuthState>();
    final conn = context.watch<ConnectivityService>();
    final offline = context.watch<OfflineService>();
    final name = _me?.fullName ?? auth.user?.fullName ?? '-';

    return Scaffold(
      backgroundColor: SaeColors.bg,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Voltar',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: ListView(
      padding: EdgeInsets.zero,
      children: [
        Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            color: SaeColors.primary,
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Column(
            children: [
              Stack(
                alignment: Alignment.bottomRight,
                children: [
                  Container(
                    width: 96, height: 96,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x33000000),
                          offset: Offset(0, 6),
                          blurRadius: 14,
                        ),
                      ],
                    ),
                    child: Text(
                      _initials(name),
                      style: const TextStyle(
                          color: SaeColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 34),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: conn.isOnline ? SaeColors.primary : SaeColors.error,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                    ),
                    child: Icon(
                      conn.isOnline ? Icons.cloud_done : Icons.cloud_off,
                      color: Colors.white, size: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(name,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 22)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.20),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(_roleLabel(auth),
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 12)),
              ),
            ],
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                _statsRow(offline),
                const SizedBox(height: 14),
                _infoCard(auth),
                const SizedBox(height: 14),
                _quickActions(auth, offline),
                const SizedBox(height: 14),
                NeuPrimaryButton(
                  label: auth.isGuestRole ? 'Sair de visitante' : 'Terminar sessão',
                  icon: Icons.logout,
                  onPressed: () => auth.logout(),
                ),
                const SizedBox(height: 22),
              ],
            ),
          ),
        ),
      ],
      ),
    );
  }

  Widget _statsRow(OfflineService offline) {
    final last = offline.lastSyncAt;
    String lastTxt = '—';
    if (last != null) {
      lastTxt = DateFormat('dd/MM HH:mm').format(last);
    }
    return Row(children: [
      Expanded(child: _statTile(Icons.offline_pin, 'Offline', '${offline.downloadedCount}')),
      const SizedBox(width: 8),
      Expanded(child: _statTile(Icons.sync_problem, 'Em fila', '${offline.pendingOutbox}')),
      const SizedBox(width: 8),
      Expanded(child: _statTile(Icons.history, 'Última sync', lastTxt)),
    ]);
  }

  Widget _statTile(IconData icon, String label, String value) {
    return NeuCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: SaeColors.primary, size: 18),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  color: SaeColors.textPrimary)),
          Text(label,
              style: const TextStyle(
                  color: SaeColors.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _infoCard(AuthState auth) {
    final username = _me?.username ?? auth.user?.username ?? '-';
    final email = _me?.email;
    final role = _me?.role ?? auth.user?.role ?? '-';
    final roleLabel = role.toUpperCase() == 'STUDENT'
        ? 'Estudante'
        : role.toUpperCase() == 'PROFESSOR'
            ? 'Professor'
            : role;
    return NeuCard(
      child: Column(
        children: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: LinearProgressIndicator(minHeight: 2),
            ),
          _row(Icons.person_outline, 'Utilizador', username),
          const Divider(height: 18),
          _row(Icons.mail_outline, 'E-mail', email ?? '—'),
          const Divider(height: 18),
          _row(Icons.verified_user_outlined, 'Tipo de conta', roleLabel),
        ],
      ),
    );
  }

  Widget _quickActions(AuthState auth, OfflineService offline) {
    return NeuCard(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      child: Column(
        children: [
          _actionTile(
            Icons.sync,
            'Sincronizar agora',
            offline.pendingOutbox > 0
                ? '${offline.pendingOutbox} pendentes'
                : 'Tudo em dia',
            onTap: offline.isSyncing ? null : () => offline.sync(),
          ),
          if (offline.downloadedCount > 0)
            _actionTile(
              Icons.storage,
              'Armazenamento offline',
              '${offline.downloadedCount} livros · ${_human(offline.totalBytes())}',
            ),
        ],
      ),
    );
  }

  Widget _actionTile(IconData icon, String title, String subtitle, {VoidCallback? onTap}) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          child: Row(children: [
            Container(
              width: 38, height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: SaeColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: SaeColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  Text(subtitle,
                      style: const TextStyle(
                          color: SaeColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            if (onTap != null)
              const Icon(Icons.chevron_right, color: SaeColors.textSecondary),
          ]),
        ),
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, color: SaeColors.textSecondary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: SaeColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  softWrap: true,
                  style: const TextStyle(
                    color: SaeColors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
