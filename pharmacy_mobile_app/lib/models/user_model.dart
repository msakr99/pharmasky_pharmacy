class UserModel {
  final int id;
  final String username;
  final String name;
  final String email;
  final String? phone;
  final String? pharmacyName;
  final AccountModel? account;

  UserModel({
    required this.id,
    required this.username,
    required this.name,
    required this.email,
    this.phone,
    this.pharmacyName,
    this.account,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      pharmacyName: json['pharmacy_name'],
      account: json['account'] != null ? AccountModel.fromJson(json['account']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'name': name,
      'email': email,
      'phone': phone,
      'pharmacy_name': pharmacyName,
      'account': account?.toJson(),
    };
  }
}

class AccountModel {
  final String remainingCredit;
  final String totalCredit;
  final String usedCredit;

  AccountModel({
    required this.remainingCredit,
    required this.totalCredit,
    required this.usedCredit,
  });

  factory AccountModel.fromJson(Map<String, dynamic> json) {
    return AccountModel(
      remainingCredit: json['remaining_credit']?.toString() ?? '0',
      totalCredit: json['total_credit']?.toString() ?? '0',
      usedCredit: json['used_credit']?.toString() ?? '0',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'remaining_credit': remainingCredit,
      'total_credit': totalCredit,
      'used_credit': usedCredit,
    };
  }
}
