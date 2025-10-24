class OfferModel {
  final int id;
  final String name;
  final String? description;
  final double sellingDiscountPercentage;
  final double discount;
  final String? image;
  final ProductModel? product;
  final StoreModel? store;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  OfferModel({
    required this.id,
    required this.name,
    this.description,
    required this.sellingDiscountPercentage,
    required this.discount,
    this.image,
    this.product,
    this.store,
    this.createdAt,
    this.updatedAt,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      sellingDiscountPercentage: (json['selling_discount_percentage'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      image: json['image'],
      product: json['product'] != null ? ProductModel.fromJson(json['product']) : null,
      store: json['store'] != null ? StoreModel.fromJson(json['store']) : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'selling_discount_percentage': sellingDiscountPercentage,
      'discount': discount,
      'image': image,
      'product': product?.toJson(),
      'store': store?.toJson(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}

class ProductModel {
  final int id;
  final String name;
  final String? description;
  final String? publicPrice;
  final String? image;

  ProductModel({
    required this.id,
    required this.name,
    this.description,
    this.publicPrice,
    this.image,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      publicPrice: json['public_price']?.toString(),
      image: json['image'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'public_price': publicPrice,
      'image': image,
    };
  }
}

class StoreModel {
  final int id;
  final String name;
  final String? address;
  final String? phone;

  StoreModel({
    required this.id,
    required this.name,
    this.address,
    this.phone,
  });

  factory StoreModel.fromJson(Map<String, dynamic> json) {
    return StoreModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      address: json['address'],
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'phone': phone,
    };
  }
}
