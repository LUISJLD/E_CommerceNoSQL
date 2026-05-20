from .aws_client import dynamo_instance
from boto3.dynamodb.conditions import Attr, Key
from django.conf import settings
from django.core.cache import cache
import copy
import logging

logger = logging.getLogger(__name__)

_CACHE_MISS = object()
_CACHED_NONE = '__E_COMMERCE_CACHED_NONE__'

class EcommerceService:
    table = dynamo_instance.table

    @staticmethod
    def _cache_aside(cache_key, fetch_func, ttl=None):
        try:
            cached_value = cache.get(cache_key, _CACHE_MISS)
        except Exception as exc:
            logger.warning('Cache read failed for key %s: %s', cache_key, exc)
            cached_value = _CACHE_MISS

        if cached_value is not _CACHE_MISS:
            if cached_value == _CACHED_NONE:
                return None
            return copy.deepcopy(cached_value)

        fresh_value = fetch_func()

        value_to_cache = _CACHED_NONE if fresh_value is None else fresh_value
        try:
            cache.set(cache_key, value_to_cache, timeout=ttl or settings.ECOMMERCE_CACHE_TTL_SECONDS)
        except Exception as exc:
            logger.warning('Cache write failed for key %s: %s', cache_key, exc)

        return fresh_value

    @staticmethod
    def get_all_user_profiles():
        def _fetch_profiles():
            # Scan con filtro para traer solo los perfiles de usuario
            items = []
            response = EcommerceService.table.scan(
                FilterExpression=Attr('sk').eq('PROFILE')
            )
            items.extend(response.get('Items', []))

            while 'LastEvaluatedKey' in response:
                response = EcommerceService.table.scan(
                    FilterExpression=Attr('sk').eq('PROFILE'),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))

            return items

        return EcommerceService._cache_aside('users:all_profiles', _fetch_profiles)

    @staticmethod
    def get_user_profile(user_id):
        cache_key = f'user:profile:{user_id}'

        def _fetch_profile():
            # Patrón 1: Perfil de usuario (GetItem)
            response = EcommerceService.table.get_item(
                Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'}
            )
            return response.get('Item')

        return EcommerceService._cache_aside(cache_key, _fetch_profile)

    @staticmethod
    def get_user_orders(user_id):
        cache_key = f'user:orders:{user_id}'

        def _fetch_orders():
            # Patrón 2: Órdenes de un usuario (Query PK)
            response = EcommerceService.table.query(
                KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & 
                                       Key('sk').begins_with('ORDER#')
            )
            return response.get('Items', [])

        return EcommerceService._cache_aside(cache_key, _fetch_orders)

    @staticmethod
    def get_order_items(order_id):
        cache_key = f'order:items:{order_id}'

        def _fetch_items():
            # Patrón 3: Ítems de una orden
            response = EcommerceService.table.query(
                KeyConditionExpression=Key('pk').eq(f'ORDER#{order_id}') & 
                                       Key('sk').begins_with('ITEM#')
            )
            return response.get('Items', [])

        return EcommerceService._cache_aside(cache_key, _fetch_items)

    @staticmethod
    def get_order_by_id(order_id):
        cache_key = f'order:by_id:{order_id}'

        def _fetch_order():
            # Patrón 4: Buscar orden sin usuario (Uso del GSI1)
            response = EcommerceService.table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('gsi1pk').eq(f'ORDER#{order_id}') & 
                                       Key('gsi1sk').eq('METADATA')
            )
            return response.get('Items', [None])[0]

        return EcommerceService._cache_aside(cache_key, _fetch_order)

    @staticmethod
    def get_all_products(category=None):
        cache_key = f'products:all:{category or "all"}'

        def _fetch_products():
            filter_exp = Attr('sk').begins_with('PRODUCT')
            if category:
                filter_exp = filter_exp & Attr('category').eq(category)

            items = []
            response = EcommerceService.table.scan(FilterExpression=filter_exp)
            items.extend(response.get('Items', []))

            while 'LastEvaluatedKey' in response:
                response = EcommerceService.table.scan(
                    FilterExpression=filter_exp,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))

            return items

        return EcommerceService._cache_aside(cache_key, _fetch_products)