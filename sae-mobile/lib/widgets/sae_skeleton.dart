import 'package:flutter/material.dart';
import '../theme.dart';

/// Linha shimmer (skeleton) simples.
class SaeSkeleton extends StatefulWidget {
  final double height;
  final double? width;
  final double radius;
  const SaeSkeleton({super.key, this.height = 14, this.width, this.radius = 8});
  @override
  State<SaeSkeleton> createState() => _SaeSkeletonState();
}

class _SaeSkeletonState extends State<SaeSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ac;

  @override
  void initState() {
    super.initState();
    _ac = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 1300),
    )..repeat();
  }

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ac,
      builder: (_, __) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(widget.radius),
          child: SizedBox(
            height: widget.height,
            width: widget.width ?? double.infinity,
            child: ShaderMask(
              shaderCallback: (rect) {
                final t = _ac.value;
                return LinearGradient(
                  begin: Alignment(-1 + t * 2, 0),
                  end: Alignment(1 + t * 2, 0),
                  colors: const [
                    Color(0xFFEFF2F5),
                    Color(0xFFF7F9FB),
                    Color(0xFFEFF2F5),
                  ],
                ).createShader(rect);
              },
              blendMode: BlendMode.srcIn,
              child: Container(color: SaeColors.line2),
            ),
          ),
        );
      },
    );
  }
}

class SaeSkeletonCard extends StatelessWidget {
  const SaeSkeletonCard({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SaeColors.line),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SaeSkeleton(height: 12, width: 80),
          SizedBox(height: 10),
          SaeSkeleton(height: 16),
          SizedBox(height: 6),
          SaeSkeleton(height: 14, width: 200),
          SizedBox(height: 12),
          Row(children: [
            SaeSkeleton(height: 24, width: 24, radius: 12),
            SizedBox(width: 8),
            SaeSkeleton(height: 12, width: 120),
          ]),
        ],
      ),
    );
  }
}
