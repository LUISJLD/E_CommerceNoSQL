from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    CartView,
    UserListView,
    UserProfileDetail,
    UserOrdersList,
    GlobalOrderSearch,
    OrderItemsList,
)

urlpatterns = [
    path('products/', ProductListView.as_view()),
    path('products/<str:product_id>/', ProductDetailView.as_view()),
    path('cart/<str:user_id>/', CartView.as_view()),
    path('users/', UserListView.as_view()),
    path('user/<str:user_id>/profile/', UserProfileDetail.as_view()),
    path('user/<str:user_id>/orders/', UserOrdersList.as_view()),
    path('orders/search/<str:order_id>/', GlobalOrderSearch.as_view()),
    path('orders/<str:order_id>/items/', OrderItemsList.as_view()),
]