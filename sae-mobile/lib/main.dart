import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'pages/home_page.dart';
import 'pages/login_page.dart';
import 'services/connectivity_service.dart';
import 'services/offline_service.dart';
import 'state/auth_state.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SaeApp());
}

class SaeApp extends StatelessWidget {
  const SaeApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()..bootstrap()),
        ChangeNotifierProvider<ConnectivityService>.value(
            value: ConnectivityService.instance),
        ChangeNotifierProvider<OfflineService>.value(
            value: OfflineService.instance..ensureInit()),
      ],
      child: MaterialApp(
        title: 'SAE',
        debugShowCheckedModeBanner: false,
        theme: buildSaeTheme(),
        home: const _Root(),
      ),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return auth.user == null ? const LoginPage() : const HomePage();
  }
}
