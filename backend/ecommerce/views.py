from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import EcommerceService


class ProductListView(APIView):
    def get(self, request):
        category = request.query_params.get('category')
        items = EcommerceService.get_all_products(category)
        return Response(items)

    def post(self, request):
        data = request.data
        name = data.get('name', '').strip()
        price = data.get('price')
        stock = data.get('stock')
        category = data.get('category', '').strip()
        image = data.get('image', '').strip()
        if not name or price is None or stock is None or not category:
            return Response({'error': 'name, price, stock and category are required'},
                            status=status.HTTP_400_BAD_REQUEST)
        pid = EcommerceService.create_product(name, price, stock, category, image)
        return Response({'message': 'Product created', 'productId': pid},
                        status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    def delete(self, request, product_id):
        EcommerceService.delete_product(product_id)
        return Response({'message': 'Product deleted', 'productId': product_id})


class CartView(APIView):
    def get(self, request, user_id):
        items = EcommerceService.get_user_cart(user_id)
        return Response(items)

    def post(self, request, user_id):
        data = request.data
        product_id = data.get('productId')
        qty = data.get('qty', 1)
        price = data.get('price', 0)
        if not product_id:
            return Response({'error': 'productId is required'}, status=status.HTTP_400_BAD_REQUEST)
        EcommerceService.add_to_cart(user_id, product_id, qty, price)
        return Response({'message': 'Product added to cart'})

    def delete(self, request, user_id):
        product_id = request.query_params.get('productId')
        if not product_id:
            return Response({'error': 'productId query param is required'},
                            status=status.HTTP_400_BAD_REQUEST)
        EcommerceService.remove_from_cart(user_id, product_id)
        return Response({'message': 'Product removed from cart'})


class UserListView(APIView):
    def get(self, request):
        items = EcommerceService.get_all_user_profiles()
        users = []
        for item in items:
            pk = item.get('pk', '')
            user_id = pk.replace('USER#', '') if isinstance(pk, str) else pk
            users.append({
                'userId': user_id,
                'pk': pk,
                **item,
            })
        return Response(users)

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
        item = EcommerceService.get_order_by_id(order_id)
        if not item:
            return Response({"error": "Orden no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response(item)

class OrderItemsList(APIView):
    def get(self, request, order_id):
        items = EcommerceService.get_order_items(order_id)
        return Response(items)