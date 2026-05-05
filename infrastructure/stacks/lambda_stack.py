from aws_cdk import Stack, Duration
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct
import os

class LambdaStack(Stack):
    def __init__(self, scope: Construct, id: str,
                 dynamo_table: dynamodb.Table, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Variables de entorno compartidas por todas las Lambdas
        shared_env = {
            "TABLE_NAME": dynamo_table.table_name,
            "DYNAMODB_ENDPOINT_URL": "http://localstack:4566",
            "REDIS_URL": "redis://redis:6379/1",
            "AWS_ACCESS_KEY_ID": "local",
            "AWS_SECRET_ACCESS_KEY": "local",
            "AWS_DEFAULT_REGION": "us-east-1",
            "CACHE_TTL_SECONDS": "60",
        }

        # Factory para crear Lambdas sin repetir código
        def make_lambda(name: str, handler_dir: str) -> _lambda.Function:
            fn = _lambda.Function(
                self, name,
                runtime=_lambda.Runtime.PYTHON_3_12,
                handler="handler.lambda_handler",
                code=_lambda.Code.from_asset(
                    f"../lambdas/{handler_dir}",
                    bundling={                       # empaqueta shared/ también
                        "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                        "command": [
                            "bash", "-c",
                            "pip install boto3 redis -t /asset-output && "
                            "cp -r /asset-input/* /asset-output/ && "
                            "cp -r /asset-input/../shared /asset-output/"
                        ],
                    }
                ),
                environment=shared_env,
                timeout=Duration.seconds(10),
            )
            dynamo_table.grant_read_data(fn)
            return fn

        # Crear una Lambda por cada endpoint
        fn_users       = make_lambda("GetAllUsers",     "get_all_users")
        fn_profile     = make_lambda("GetUserProfile",  "get_user_profile")
        fn_orders      = make_lambda("GetUserOrders",   "get_user_orders")
        fn_order_by_id = make_lambda("GetOrderById",    "get_order_by_id")
        fn_order_items = make_lambda("GetOrderItems",   "get_order_items")

        # API Gateway REST → mismas rutas que tu Django
        api = apigw.RestApi(self, "EcommerceApi",
                            rest_api_name="ecommerce-serverless")

        users = api.root.add_resource("users")
        users.add_method("GET",
            apigw.LambdaIntegration(fn_users))

        user = users.add_resource("{user_id}")
        user.add_resource("profile").add_method("GET",
            apigw.LambdaIntegration(fn_profile))
        user.add_resource("orders").add_method("GET",
            apigw.LambdaIntegration(fn_orders))

        orders = api.root.add_resource("orders")
        order = orders.add_resource("{order_id}")
        order.add_method("GET",
            apigw.LambdaIntegration(fn_order_by_id))
        order.add_resource("items").add_method("GET",
            apigw.LambdaIntegration(fn_order_items))