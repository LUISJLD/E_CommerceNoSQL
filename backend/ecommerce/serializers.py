from rest_framework import serializers

class UserProfileSerializer(serializers.Serializer):
    pk = serializers.CharField(read_only=True)
    sk = serializers.CharField(read_only=True)
    name = serializers.CharField()
    email = serializers.EmailField()

class OrderSerializer(serializers.Serializer):
    pk = serializers.CharField()
    sk = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    order_date = serializers.CharField()