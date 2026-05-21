import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'pages/home_page.dart';
import 'pages/login_page.dart';
import 'services/connectivity_service.dart';
import 'services/offline_service.dart';
import 'state/auth_state.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light, // iOS
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));
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
          value: ConnectivityService.instance,
        ),
        ChangeNotifierProvider<OfflineService>.value(
          value: OfflineService.instance,
        ),
      ],
      child: MaterialApp(
        title: 'SAE',
        debugShowCheckedModeBanner: false,
        theme: buildSaeTheme(),
        home: const _Root(),
        builder: (ctx, child) => MediaQuery(
          // bloqueia o scaling extremo do utilizador para não partir layouts
          data: MediaQuery.of(ctx).copyWith(
            textScaler: MediaQuery.of(ctx).textScaler.clamp(
              minScaleFactor: 0.9,
              maxScaleFactor: 1.2,
            ),
          ),
          child: child!,
        ),
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
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return PageTransitionSwitcher(
      child: auth.user == null ? const LoginPage() : const HomePage(),
    );
  }
}

/// Pequeno wrapper para fade+scale entre login/home.
class PageTransitionSwitcher extends StatelessWidget {
  final Widget child;
  const PageTransitionSwitcher({super.key, required this.child});
  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 280),
      transitionBuilder: (c, anim) => FadeTransition(
        opacity: anim,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.985, end: 1).animate(
            CurvedAnimation(parent: anim, curve: Curves.easeOut),
          ),
          child: c,
        ),
      ),
      child: KeyedSubtree(
        key: ValueKey(child.runtimeType),
        child: child,
      ),
    );
  }
}
