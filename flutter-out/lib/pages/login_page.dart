import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';

/// Login moderno: hero navy com gradiente + cartão branco fluido.
/// Mantém lógica original (login / enterAsGuest).
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  bool _remember = true;
  String? _error;
  late final AnimationController _ac;

  @override
  void initState() {
    super.initState();
    _ac = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 700),
    )..forward();
  }

  @override
  void dispose() {
    _ac.dispose();
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_userCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Preenche o utilizador e a palavra-passe.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AuthState>().login(_userCtrl.text.trim(), _passCtrl.text);
    } catch (_) {
      setState(() => _error = 'Credenciais inválidas ou servidor indisponível.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final h = MediaQuery.of(context).size.height;
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: h - 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Hero(animation: _ac),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 24, 22, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _label('Email ou nº de estudante'),
                      const SizedBox(height: 6),
                      _Field(
                        controller: _userCtrl,
                        icon: LucideIcons.user,
                        hint: 'aluno.silva@sae.mz',
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _label('Palavra-passe'),
                          GestureDetector(
                            onTap: () {},
                            child: const Text('Esqueci-me',
                              style: TextStyle(color: SaeColors.primary,
                                  fontWeight: FontWeight.w700, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      _Field(
                        controller: _passCtrl,
                        icon: LucideIcons.lock,
                        hint: '••••••••',
                        obscure: _obscure,
                        onSubmitted: (_) => _submit(),
                        trailing: IconButton(
                          icon: Icon(_obscure ? LucideIcons.eye : LucideIcons.eyeOff,
                            size: 18, color: SaeColors.textSecondary),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      const SizedBox(height: 14),
                      _RememberRow(value: _remember,
                          onChanged: (v) => setState(() => _remember = v)),
                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: SaeColors.errorSoft,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFCA5A5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.alertCircle, color: SaeColors.error, size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_error!, style: const TextStyle(
                                  color: Color(0xFF991B1B),
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                )),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 22),
                      _PrimaryButton(loading: _loading, onPressed: _loading ? null : _submit),
                      const SizedBox(height: 14),
                      const _Divider(),
                      const SizedBox(height: 14),
                      _GhostButton(
                        onPressed: () => context.read<AuthState>().enterAsGuest(),
                        icon: LucideIcons.eye,
                        label: 'Entrar como visitante',
                      ),
                      const SizedBox(height: 18),
                      Center(
                        child: RichText(
                          text: const TextSpan(
                            style: TextStyle(color: SaeColors.textSecondary, fontSize: 12),
                            children: [
                              TextSpan(text: 'Não tens conta?  '),
                              TextSpan(
                                text: 'Pede ao teu professor',
                                style: TextStyle(
                                  color: SaeColors.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String t) => Text(t, style: const TextStyle(
    fontSize: 12, color: SaeColors.ink2, fontWeight: FontWeight.w700,
  ));
}

class _Hero extends StatelessWidget {
  final AnimationController animation;
  const _Hero({required this.animation});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 36),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A1628),
            Color(0xFF0F2447),
            Color(0xFF134E2C),
          ],
        ),
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          Positioned(
            top: -30, right: -30,
            child: Container(
              width: 180, height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: SaeColors.primary.withValues(alpha: 0.20),
              ),
            ),
          ),
          Positioned(
            bottom: -60, left: -40,
            child: Container(
              width: 200, height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF2563EB).withValues(alpha: 0.10),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40, height: 40, alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: SaeColors.primary,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Text('S',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 19,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text('SAE', style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  )),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text('SNE MOÇAMBIQUE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 0.08), end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
                  child: const Text(
                    'Bem-vindo\nde volta.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1.2,
                      height: 1.05,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              FadeTransition(
                opacity: CurvedAnimation(parent: animation, curve: const Interval(0.2, 1)),
                child: Text(
                  'Entra para continuares a aprender.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 13.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final bool obscure;
  final Widget? trailing;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;
  const _Field({
    required this.controller,
    required this.icon,
    required this.hint,
    this.obscure = false,
    this.trailing,
    this.onSubmitted,
    this.textInputAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SaeColors.line),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          Icon(icon, size: 17, color: SaeColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: obscure,
              onSubmitted: onSubmitted,
              textInputAction: textInputAction,
              cursorColor: SaeColors.primary,
              style: const TextStyle(fontSize: 14, color: SaeColors.textPrimary,
                  fontWeight: FontWeight.w500),
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: hint,
                hintStyle: const TextStyle(color: SaeColors.textMuted, fontWeight: FontWeight.w500),
                isCollapsed: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _RememberRow extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  const _RememberRow({required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 19, height: 19, alignment: Alignment.center,
              decoration: BoxDecoration(
                color: value ? SaeColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(5),
                border: Border.all(
                  color: value ? SaeColors.primary : SaeColors.line,
                  width: 1.4,
                ),
              ),
              child: value
                  ? const Icon(LucideIcons.check, color: Colors.white, size: 13)
                  : null,
            ),
            const SizedBox(width: 10),
            const Text('Manter sessão iniciada', style: TextStyle(
              color: SaeColors.ink2, fontWeight: FontWeight.w600, fontSize: 13,
            )),
          ],
        ),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final bool loading;
  final VoidCallback? onPressed;
  const _PrimaryButton({required this.loading, required this.onPressed});
  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: disabled ? null : onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 54,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: disabled ? const Color(0xFF8CD3AA) : SaeColors.primary,
            borderRadius: BorderRadius.circular(14),
            boxShadow: disabled ? null : [
              BoxShadow(
                color: SaeColors.primary.withValues(alpha: 0.38),
                blurRadius: 18, offset: const Offset(0, 8),
              ),
            ],
          ),
          child: loading
              ? const SizedBox(
                  width: 22, height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Entrar', style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      letterSpacing: -0.1,
                    )),
                    SizedBox(width: 6),
                    Icon(LucideIcons.arrowRight, size: 18, color: Colors.white),
                  ],
                ),
        ),
      ),
    );
  }
}

class _GhostButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  const _GhostButton({required this.icon, required this.label, required this.onPressed});
  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onPressed,
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: SaeColors.line),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: SaeColors.ink2),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(
                color: SaeColors.ink2,
                fontWeight: FontWeight.w700,
                fontSize: 13.5,
              )),
            ],
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: Divider(color: SaeColors.line, height: 1)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('OU', style: TextStyle(
            color: SaeColors.textMuted,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          )),
        ),
        Expanded(child: Divider(color: SaeColors.line, height: 1)),
      ],
    );
  }
}
