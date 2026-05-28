from aws_cdk import Stack, Duration, CfnOutput, RemovalPolicy
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_s3 as s3
from constructs import Construct

class LambdaStack(Stack):
    def __init__(self, scope: Construct, id: str,
                 dynamo_table: dynamodb.Table,
                 redis_host: str,
                 redis_port: str,
                 **kwargs):
        super().__init__(scope, id, **kwargs)

        # ─── BUCKET S3 PARA IMÁGENES DE PRODUCTOS ───
        product_images_bucket = s3.Bucket(
            self, "ProductImagesBucket",
            bucket_name="ecommerce-product-images-local",
            removal_policy=RemovalPolicy.DESTROY,

            cors=[s3.CorsRule(
                allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                allowed_origins=["*"],
                allowed_headers=["*"]
            )]
        )

        shared_env = {
            "TABLE_NAME": dynamo_table.table_name,
            "DYNAMODB_ENDPOINT_URL": "http://localstack:4566",
            "REDIS_URL": f"redis://{redis_host}:{redis_port}/1",
            "CACHE_TTL_SECONDS": "60",
            "CART_TTL_SECONDS": "300",
            "APP_REGION": "us-east-1",
            "JWT_SECRET": "mi_super_secreto_local_123", # Para uso local
            "IMAGES_BUCKET_NAME": product_images_bucket.bucket_name,
        }

        # Código base unificado para todas las Lambdas
        common_code = _lambda.Code.from_asset(
            "../lambdas",
            bundling={
                "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                "command": [
                    "bash", "-c",
                    "pip install redis PyJWT -t /asset-output && cp -r /asset-input/* /asset-output/"
                ],
            }
        )

        def make_lambda(name: str, handler_dir: str) -> _lambda.Function:
            fn = _lambda.Function(
                self, name,
                runtime=_lambda.Runtime.PYTHON_3_12,
                handler=f"{handler_dir}.handler.lambda_handler",
                function_name=f"EcommerceLambda-{name}", 
                code=common_code,
                environment=shared_env,
                timeout=Duration.seconds(10),
            )
            dynamo_table.grant_read_write_data(fn) # Otorgamos r/w por simplicidad local
            return fn

        # Instanciación de las Lambdas
        fn_auth        = make_lambda("Auth",           "auth")
        fn_orders      = make_lambda("GetUserOrders",  "get_user_orders")
        fn_order_items = make_lambda("GetOrderItems",  "get_order_items")
        fn_products    = make_lambda("GetAllProducts", "get_products")
        fn_cart        = make_lambda("ManageUserCart", "manage_cart")
        fn_create_order = make_lambda("CreateOrder",   "create_order")
        
        # Lambdas de Admin
        fn_admin_products = make_lambda("AdminProducts", "manage_products")
        fn_admin_orders   = make_lambda("AdminOrders",   "manage_orders")

        # Permisos S3 para que el admin pueda generar presigned URLs o subir
        product_images_bucket.grant_read_write(fn_admin_products)

        # Configuración del API Gateway Central
        api = apigw.RestApi(self, "EcommerceApi",
            rest_api_name="ecommerce-serverless",
            deploy_options=apigw.StageOptions(stage_name="prod"),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            )
        )
        
        from aws_cdk import Tags
        Tags.of(api).add("_custom_id_", "ecommerce123")

        # ─── RUTAS DEL API ───

        # Auth
        auth = api.root.add_resource("auth")
        auth.add_resource("login").add_method("POST", apigw.LambdaIntegration(fn_auth))
        auth.add_resource("register").add_method("POST", apigw.LambdaIntegration(fn_auth))

        # Admin
        admin = api.root.add_resource("admin")
        admin_products = admin.add_resource("products")
        admin_products.add_method("POST", apigw.LambdaIntegration(fn_admin_products))
        admin_product = admin_products.add_resource("{id}")
        admin_product.add_method("PUT", apigw.LambdaIntegration(fn_admin_products))
        admin_product.add_method("DELETE", apigw.LambdaIntegration(fn_admin_products))
        
        admin_orders = admin.add_resource("orders")
        admin_orders.add_method("GET", apigw.LambdaIntegration(fn_admin_orders))
        admin_order = admin_orders.add_resource("{id}")
        admin_order.add_resource("status").add_method("PUT", apigw.LambdaIntegration(fn_admin_orders))

        # Carrito
        cart_root = api.root.add_resource("cart")
        cart_user = cart_root.add_resource("{user_id}")
        cart_user.add_method("GET", apigw.LambdaIntegration(fn_cart))
        cart_user.add_method("POST", apigw.LambdaIntegration(fn_cart))
        cart_user.add_method("DELETE", apigw.LambdaIntegration(fn_cart))

        # Productos
        products = api.root.add_resource("products")
        products.add_method("GET", apigw.LambdaIntegration(fn_products))

        # Usuarios
        user_resource = api.root.add_resource("user")
        user = user_resource.add_resource("{user_id}")
        user.add_resource("orders").add_method("GET", apigw.LambdaIntegration(fn_orders))

        # Órdenes
        orders = api.root.add_resource("orders")
        orders.add_method("POST", apigw.LambdaIntegration(fn_create_order))
        order = orders.add_resource("{order_id}")
        order.add_resource("items").add_method("GET", apigw.LambdaIntegration(fn_order_items))

        # Output del API Gateway
        CfnOutput(self, "ApiGatewayUrl",
            value=f"http://localhost:4566/restapis/{api.rest_api_id}/prod/_user_request_",
            description="URL base del API Gateway en LocalStack",
            export_name="EcommerceApiUrl",
        )