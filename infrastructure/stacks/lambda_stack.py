from aws_cdk import Stack, Duration
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct

class LambdaStack(Stack):
    def __init__(self, scope: Construct, id: str,
                 dynamo_table: dynamodb.Table,
                 redis_host: str,
                 redis_port: str,
                 **kwargs):
        super().__init__(scope, id, **kwargs)

        shared_env = {
            "TABLE_NAME": dynamo_table.table_name,
            "DYNAMODB_ENDPOINT_URL": "http://localstack:4566",
            "REDIS_URL": f"redis://{redis_host}:{redis_port}/1",
            "CACHE_TTL_SECONDS": "60",
            "CART_TTL_SECONDS": "300",
            "APP_REGION": "us-east-1",
        }

        def make_lambda(name: str, handler_dir: str) -> _lambda.Function:
            fn = _lambda.Function(
                self, name,
                runtime=_lambda.Runtime.PYTHON_3_12,
                handler="handler.lambda_handler",
                code=_lambda.Code.from_asset(
                    "../lambdas",
                    bundling={
                        "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                        "command": [
                            "bash", "-c",
                            f"""
                            pip install boto3 redis -t /asset-output &&
                            cp -r /asset-input/{handler_dir}/* /asset-output/ &&
                            cp -r /asset-input/shared /asset-output/
                            """
                        ],
                    }
                ),
                environment=shared_env,
                timeout=Duration.seconds(10),
            )
            # Por defecto todas leen de la tabla
            dynamo_table.grant_read_data(fn)
            return fn

        # Instanciación de las Lambdas del ecosistema
        fn_users       = make_lambda("GetAllUsers",    "get_all_users")
        fn_profile     = make_lambda("GetUserProfile", "get_user_profile")
        fn_orders      = make_lambda("GetUserOrders",  "get_user_orders")
        fn_order_by_id = make_lambda("GetOrderById",   "get_order_by_id")
        fn_order_items = make_lambda("GetOrderItems",  "get_order_items")
        fn_products    = make_lambda("GetAllProducts", "get_products")
        
        # Nueva Lambda exclusiva para la gestión del Carrito (Opción A)
        fn_cart        = make_lambda("ManageUserCart", "manage_cart")
        
        # Otorgar explícitamente permisos de ESCRITURA y BORRADO además de la lectura
        dynamo_table.grant_read_write_data(fn_cart)

        # Configuración del API Gateway Central
        api = apigw.RestApi(self, "EcommerceApi",
                            rest_api_name="ecommerce-serverless",
                            default_cors_preflight_options=apigw.CorsOptions(
                                allow_origins=apigw.Cors.ALL_ORIGINS,
                                allow_methods=apigw.Cors.ALL_METHODS
                            ))

        # Enrutamiento del Carrito corregido mapeado a fn_cart
        cart_root = api.root.add_resource("cart")
        cart_user = cart_root.add_resource("{user_id}")
        cart_user.add_method("GET", apigw.LambdaIntegration(fn_cart))
        cart_user.add_method("POST", apigw.LambdaIntegration(fn_cart))
        cart_user.add_method("DELETE", apigw.LambdaIntegration(fn_cart))

        # Catálogo de Productos
        products = api.root.add_resource("products")
        products.add_method("GET", apigw.LambdaIntegration(fn_products))

        # Ecosistema de Usuarios y Perfiles
        users = api.root.add_resource("users")
        users.add_method("GET", apigw.LambdaIntegration(fn_users))

        user_under_users = users.add_resource("{user_id}")
        user_under_users.add_method("GET", apigw.LambdaIntegration(fn_profile))

        user_resource = api.root.add_resource("user")
        user = user_resource.add_resource("{user_id}")
        user.add_resource("profile").add_method("GET",
            apigw.LambdaIntegration(fn_profile))
        user.add_resource("orders").add_method("GET",
            apigw.LambdaIntegration(fn_orders))

        # Ecosistema de Órdenes e Historiales
        orders = api.root.add_resource("orders")
        order = orders.add_resource("{order_id}")
        order.add_method("GET", apigw.LambdaIntegration(fn_order_by_id))
        order.add_resource("items").add_method("GET",
            apigw.LambdaIntegration(fn_order_items))