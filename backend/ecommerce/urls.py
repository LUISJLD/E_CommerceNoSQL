from django.urls import path
from .views import UserProfileDetail, UserOrdersList, GlobalOrderSearch

urlpatterns = [
    path('user/<str:user_id>/profile/', UserProfileDetail.as_view()),
    path('user/<str:user_id>/orders/', UserOrdersList.as_view()),
    path('orders/search/<str:order_id>/', GlobalOrderSearch.as_view()),
]