from django.urls import path
from .views import UserListView, UserProfileDetail, UserOrdersList, GlobalOrderSearch, OrderItemsList

urlpatterns = [
    path('users/', UserListView.as_view()),
    path('user/<str:user_id>/profile/', UserProfileDetail.as_view()),
    path('user/<str:user_id>/orders/', UserOrdersList.as_view()),
    path('orders/search/<str:order_id>/', GlobalOrderSearch.as_view()),
    path('orders/<str:order_id>/items/', OrderItemsList.as_view()),
]