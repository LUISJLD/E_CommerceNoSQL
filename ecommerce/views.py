from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import EcommerceService

class UserProfileDetail(APIView):
    def get(self, request, user_id):
        item = EcommerceService.get_user_profile(user_id)
        if not item:
            return Response({"error": "Perfil no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(item)

class UserOrdersList(APIView):
    def get(self, request, user_id):
        items = EcommerceService.get_user_orders(user_id)
        return Response(items)

class GlobalOrderSearch(APIView):
    def get(self, request, order_id):
        # Este usa el GSI1 definido en tu script
        item = EcommerceService.get_order_by_id(order_id)
        if not item:
            return Response({"error": "Orden no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response(item)