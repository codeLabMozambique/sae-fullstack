import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

class ConnectivityService extends ChangeNotifier {
  ConnectivityService._() {
    _init();
  }
  static final ConnectivityService instance = ConnectivityService._();

  final Connectivity _c = Connectivity();
  bool _online = true;
  bool get isOnline => _online;

  StreamSubscription<List<ConnectivityResult>>? _sub;

  Future<void> _init() async {
    final initial = await _c.checkConnectivity();
    _updateFrom(initial);
    _sub = _c.onConnectivityChanged.listen(_updateFrom);
  }

  void _updateFrom(List<ConnectivityResult> results) {
    final wasOnline = _online;
    _online = results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet ||
        r == ConnectivityResult.vpn);
    if (wasOnline != _online) notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
