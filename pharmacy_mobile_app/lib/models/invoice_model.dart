class InvoiceModel {
  final int id;
  final String? invoiceNumber;
  final UserModel? user;
  final UserModel? seller;
  final int? itemsCount;
  final int? totalQuantity;
  final String totalPrice;
  final String? status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  InvoiceModel({
    required this.id,
    this.invoiceNumber,
    this.user,
    this.seller,
    this.itemsCount,
    this.totalQuantity,
    required this.totalPrice,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] ?? 0,
      invoiceNumber: json['invoice_number'],
      user: json['user'] != null ? UserModel.fromJson(json['user']) : null,
      seller: json['seller'] != null ? UserModel.fromJson(json['seller']) : null,
      itemsCount: json['items_count'],
      totalQuantity: json['total_quantity'],
      totalPrice: json['total_price']?.toString() ?? '0',
      status: json['status'],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'invoice_number': invoiceNumber,
      'user': user?.toJson(),
      'seller': seller?.toJson(),
      'items_count': itemsCount,
      'total_quantity': totalQuantity,
      'total_price': totalPrice,
      'status': status,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
