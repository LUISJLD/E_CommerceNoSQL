import os
import shutil
import subprocess

import jsii
import aws_cdk as cdk
from aws_cdk import Stack, Duration, CfnOutput, BundlingOptions
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct


@jsii.implements(cdk.ILocalBundling)
class _LocalBundler:
    """
    Bundla una Lambda localmente (pip + copia) sin Docker.
    JSII llama try_bundle() primero; si retorna True, omite Docker.
    """

    def __init__(self, handler_dir: str, lambdas_root: str):
        self.handler_dir = handler_dir
        self.lambdas_root = lambdas_root

    def try_bundle(self, output_dir: str, options: cdk.BundlingOptions) -> bool:
        subprocess.run(
            ["pip3", "install", "boto3", "redis", "-t", output_dir, "-q"],
            check=True,
        )
        handler_src = os.path.join(self.lambdas_root, self.handler_dir)
        for item in os.listdir(handler_src):
            src = os.path.join(handler_src, item)
            dst = os.path.join(output_dir, item)
            if os.path.isfile(src):
                shutil.copy2(src, dst)
            else:
                shutil.copytree(src, dst, dirs_exist_ok=True)
        shutil.copytree(
            os.path.join(self.lambdas_root, "shared"),
            os.path.join(output_dir, "shared"),
            dirs_exist_ok=True,
        )
        return True


class LambdaStack(Stack):
    def __init__(self, scope: Construct, id: str,
                 dynamo_table: dynamodb.Table,
                 redis_host: str,
                 redis_port: str,
                 **kwargs):
        super().__init__(scope, id, **kwargs)

        # Ruta absoluta a /lambdas (funciona tanto en local como dentro del contenedor)
        lambdas_root = os.path.normpath(
            os.path.join(os.path.dirname(__file__), "..", "..", "lambdas")
        )

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
                function_name=f"EcommerceLambda-{name}",
                code=_lambda.Code.from_asset(
                    os.path.join(lambdas_root, handler_dir),
                    bundling=BundlingOptions(
                        # local=... se intenta primero; si try_bundle() → True, no usa Docker
                        local=_LocalBundler(handler_dir, lambdas_root),
                        image=_lambda.Runtime.PYTHON_3_12.bundling_image,
                        command=[
                            "bash", "-c",
                            f"pip install boto3 redis -t /asset-output && "
                            f"cp -r /asset-input/* /asset-output/ && "
                            f"cp -r {os.path.join(lambdas_root, 'shared')} /asset-output/",
                        ],
                    ),
                ),
                environment=shared_env,
                timeout=Duration.seconds(10),
            )
            dynamo_table.grant_read_data(fn)
            return fn

        fn_users       = make_lambda("GetAllUsers",    "get_all_users")
        fn_profile     = make_lambda("GetUserProfile", "get_user_profile")
        fn_orders      = make_lambda("GetUserOrders",  "get_user_orders")
        fn_order_by_id = make_lambda("GetOrderById",   "get_order_by_id")
        fn_order_items = make_lambda("GetOrderItems",  "get_order_items")
        fn_products    = make_lambda("GetAllProducts", "get_products")
        fn_cart        = make_lambda("ManageUserCart", "manage_cart")
        dynamo_table.grant_read_write_data(fn_cart)

        fn_manage_products = make_lambda("ManageProducts", "manage_products")
        dynamo_table.grant_read_write_data(fn_manage_products)

        api = apigw.RestApi(self, "EcommerceApi",
                            rest_api_name="ecommerce-serverless",
                            default_cors_preflight_options=apigw.CorsOptions(
                                allow_origins=apigw.Cors.ALL_ORIGINS,
                                allow_methods=apigw.Cors.ALL_METHODS,
                            ))

        # /cart/{user_id}
        cart_user = api.root.add_resource("cart").add_resource("{user_id}")
        cart_user.add_method("GET",    apigw.LambdaIntegration(fn_cart))
        cart_user.add_method("POST",   apigw.LambdaIntegration(fn_cart))
        cart_user.add_method("DELETE", apigw.LambdaIntegration(fn_cart))

        # /products  y  /products/{product_id}
        products = api.root.add_resource("products")
        products.add_method("GET",  apigw.LambdaIntegration(fn_products))
        products.add_method("POST", apigw.LambdaIntegration(fn_manage_products))
        product_item = products.add_resource("{product_id}")
        product_item.add_method("DELETE", apigw.LambdaIntegration(fn_manage_products))

        # /users  y  /users/{user_id}
        users = api.root.add_resource("users")
        users.add_method("GET", apigw.LambdaIntegration(fn_users))
        users.add_resource("{user_id}").add_method("GET", apigw.LambdaIntegration(fn_profile))

        # /user/{user_id}/profile  y  /user/{user_id}/orders
        user = api.root.add_resource("user").add_resource("{user_id}")
        user.add_resource("profile").add_method("GET", apigw.LambdaIntegration(fn_profile))
        user.add_resource("orders").add_method("GET",  apigw.LambdaIntegration(fn_orders))

        # /orders/{order_id}  y  /orders/{order_id}/items
        order = api.root.add_resource("orders").add_resource("{order_id}")
        order.add_method("GET", apigw.LambdaIntegration(fn_order_by_id))
        order.add_resource("items").add_method("GET", apigw.LambdaIntegration(fn_order_items))

        CfnOutput(self, "ApiGatewayUrl",
            value=f"http://localhost:4566/restapis/{api.rest_api_id}/prod/_user_request_",
            description="URL base del API Gateway en LocalStack",
            export_name="EcommerceApiUrl",
        )
