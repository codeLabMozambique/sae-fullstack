import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _obscure = true;

  Future<void> _submit() async {
    if (_userCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Preencha os dois campos.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AuthState>().login(_userCtrl.text.trim(), _passCtrl.text);
    } catch (e) {
      setState(() => _error = 'Credenciais inválidas ou servidor indisponível.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: SaeColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'SAE',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Bem-vindo',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: SaeColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Entre com a sua conta para continuar.',
                    style: TextStyle(color: SaeColors.textSecondary),
                  ),
                  const SizedBox(height: 28),
                  TextField(
                    controller: _userCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Utilizador ou e-mail',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _passCtrl,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: 'Palavra-passe',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    onSubmitted: (_) => _submit(),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: SaeColors.error)),
                  ],
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Entrar'),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Aplicação para alunos e professores.\nBackend: gateway na porta 8080.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: SaeColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
