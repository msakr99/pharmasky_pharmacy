import 'product_model.dart';

class ShortageModel {
  final int id;
  final ProductModel product;
  final DateTime createdAt;
  final DateTime? updatedAt;

  ShortageModel({
    required this.id,
    required this.product,
    required this.createdAt,
    this.updatedAt,
  });

  factory ShortageModel.fromJson(Map<String, dynamic> json) {
    return ShortageModel(
      id: json['id'] ?? 0,
      product: ProductModel.fromJson(json['product'] ?? {}),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product': product.toJson(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
