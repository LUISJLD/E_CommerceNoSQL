#!/usr/bin/env python3
"""
deploy.py — Despliega toda la infraestructura en LocalStack usando boto3.

Reemplaza `cdklocal deploy` para evitar problemas de credenciales Node.js
dentro de contenedores Docker. Crea:
  - Tabla DynamoDB (Ecommerce) + GSI1
  - Rol IAM para Lambdas
  - 8 funciones Lambda (zipeadas localmente)
  - API Gateway REST + todas las rutas
  - Escribe Frontend/.env con la URL final
"""

import boto3, os, json, time, sys, shutil, subprocess
from pathlib import Path

# ── Configuración ─────────────────────────────────────────────────────────────
ENDPOINT   = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:4566")
REGION     = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
TABLE      = os.getenv("TABLE_NAME", "Ecommerce")
REDIS_HOST = os.getenv("REDIS_HOST", "redis_cache")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

# Cuando LocalStack ejecuta el script via exec(), __file__ no está definido.
# Usamos una ruta fija que coincide con los volúmenes del compose.
_HERE      = Path(globals().get("__file__", "/etc/localstack/init/ready.d/01_deploy.py"))
ROOT       = Path("/app") if Path("/app/lambdas").exists() else _HERE.parent.parent
LAMBDAS    = ROOT / "lambdas"
SHARED     = LAMBDAS / "shared"
FRONTEND   = ROOT / "Frontend"

SESSION_KWARGS = dict(
    region_name=REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
    endpoint_url=ENDPOINT,
)

def boto(service):
    return boto3.client(service, **SESSION_KWARGS)

# ── 1. DynamoDB ────────────────────────────────────────────────────────────────
def create_dynamo():
    ddb = boto("dynamodb")
    try:
        ddb.describe_table(TableName=TABLE)
        print(f"  ✔ Tabla '{TABLE}' ya existe")
        return
    except ddb.exceptions.ResourceNotFoundException:
        pass

    ddb.create_table(
        TableName=TABLE,
        KeySchema=[
            {"AttributeName": "pk", "KeyType": "HASH"},
            {"AttributeName": "sk", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "pk",     "AttributeType": "S"},
            {"AttributeName": "sk",     "AttributeType": "S"},
            {"AttributeName": "gsi1pk", "AttributeType": "S"},
            {"AttributeName": "gsi1sk", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
        GlobalSecondaryIndexes=[{
            "IndexName": "GSI1",
            "KeySchema": [
                {"AttributeName": "gsi1pk", "KeyType": "HASH"},
                {"AttributeName": "gsi1sk", "KeyType": "RANGE"},
            ],
            "Projection": {"ProjectionType": "ALL"},
        }],
    )
    # Esperar a que esté ACTIVE
    waiter = ddb.get_waiter("table_exists")
    waiter.wait(TableName=TABLE, WaiterConfig={"MaxAttempts": 20, "Delay": 2})
    print(f"  ✔ Tabla '{TABLE}' creada con GSI1")

# ── 2. IAM Role ───────────────────────────────────────────────────────────────
def create_lambda_role():
    iam = boto("iam")
    role_name = "EcommerceLambdaRole"
    try:
        resp = iam.get_role(RoleName=role_name)
        print(f"  ✔ Rol '{role_name}' ya existe")
        return resp["Role"]["Arn"]
    except iam.exceptions.NoSuchEntityException:
        pass

    assume = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"},
                       "Action": "sts:AssumeRole"}]
    })
    resp = iam.create_role(RoleName=role_name, AssumeRolePolicyDocument=assume)
    iam.attach_role_policy(
        RoleName=role_name,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    )
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName="DynamoFullAccess",
        PolicyDocument=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": "dynamodb:*", "Resource": "*"}]
        }),
    )
    print(f"  ✔ Rol '{role_name}' creado")
    return resp["Role"]["Arn"]

# ── 3. Lambda (hot-reload) ────────────────────────────────────────────────────
# LocalStack hot-reload: usa S3Bucket="hot-reload" y S3Key=ruta del HOST.
# Docker daemon monta esa ruta del host en /var/task del container Lambda.
# Cold start <1s y cambios al código se reflejan sin redeployar.

def _detect_host_lambdas_path() -> str:
    """Detecta la ruta del host donde están las lambdas.

    En Docker-in-Docker, /app/lambdas es interna. Necesitamos la ruta
    que Docker daemon (host) usa para montar ese volumen.
    """
    # 1. Variable explícita del compose
    host_path = os.getenv("LAMBDA_HOST_PROJECT_PATH")
    if host_path:
        return host_path.replace("\\", "/") + "/lambdas"

    # 2. Docker inspect del container actual
    import subprocess as sp
    try:
        result = sp.run(
            ["docker", "inspect", "localstack",
             "--format", '{{range .Mounts}}{{if eq .Destination "/app/lambdas"}}{{.Source}}{{end}}{{end}}'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().replace("\\", "/")
    except Exception:
        pass

    # 3. Fallback — ruta interna (funciona si LocalStack corre sin Docker-in-Docker)
    return "/app/lambdas"

def _prepare_lambda_dir(handler_dir: str) -> None:
    """Copia shared/ dentro del directorio del handler para hot-reload."""
    src = LAMBDAS / handler_dir
    shared_dst = src / "shared"
    if not shared_dst.exists():
        shutil.copytree(SHARED, shared_dst, dirs_exist_ok=True)

def create_lambdas(role_arn: str) -> dict[str, str]:
    lam = boto("lambda")
    shared_env = {
        "TABLE_NAME":            TABLE,
        "DYNAMODB_ENDPOINT_URL": ENDPOINT,
        "REDIS_URL":             f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
        "CACHE_TTL_SECONDS":     os.getenv("CACHE_TTL_SECONDS", "30"),
        "CART_TTL_SECONDS":      os.getenv("CART_TTL_SECONDS", "60"),
        "APP_REGION":            REGION,
    }
    handlers = {
        "EcommerceLambda-GetAllUsers":    "get_all_users",
        "EcommerceLambda-GetUserProfile": "get_user_profile",
        "EcommerceLambda-GetUserOrders":  "get_user_orders",
        "EcommerceLambda-GetOrderById":   "get_order_by_id",
        "EcommerceLambda-GetOrderItems":  "get_order_items",
        "EcommerceLambda-GetAllProducts": "get_products",
        "EcommerceLambda-ManageUserCart": "manage_cart",
        "EcommerceLambda-ManageProducts": "manage_products",
    }

    # Instalar dependencias (redis) en cada handler para hot-reload
    for handler_dir in handlers.values():
        handler_path = LAMBDAS / handler_dir
        marker = handler_path / "_deps_installed"
        if not marker.exists():
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "redis",
                 "-t", str(handler_path), "-q"],
                check=True,
            )
            marker.write_text("ok")
    print("  ⚙  Dependencias instaladas en handlers")

    host_lambdas = _detect_host_lambdas_path()
    print(f"  📂 Host lambdas path: {host_lambdas}")

    arns = {}
    for fn_name, handler_dir in handlers.items():
        _prepare_lambda_dir(handler_dir)
        hot_reload_path = f"{host_lambdas}/{handler_dir}"

        try:
            lam.get_function(FunctionName=fn_name)
            lam.delete_function(FunctionName=fn_name)
            time.sleep(0.5)
        except lam.exceptions.ResourceNotFoundException:
            pass

        try:
            lam.create_function(
                FunctionName=fn_name,
                Runtime="python3.12",
                Role=role_arn,
                Handler="handler.lambda_handler",
                Code={"S3Bucket": "hot-reload", "S3Key": hot_reload_path},
                Environment={"Variables": shared_env},
                Timeout=30,
            )
            print(f"  ✔ {fn_name} → hot-reload ({hot_reload_path})")
        except Exception as e:
            print(f"  ❌ Error creando {fn_name}: {e}")
            raise
        fn_resp = lam.get_function(FunctionName=fn_name)
        arns[fn_name] = fn_resp["Configuration"]["FunctionArn"]
    return arns

# ── 4. API Gateway ─────────────────────────────────────────────────────────────
CORS_HEADERS = {
    "method.response.header.Access-Control-Allow-Origin":  True,
    "method.response.header.Access-Control-Allow-Headers": True,
    "method.response.header.Access-Control-Allow-Methods": True,
}

def _add_method(apigw, rest_api_id: str, resource_id: str,
                http_method: str, fn_arn: str, region: str):
    apigw.put_method(
        restApiId=rest_api_id, resourceId=resource_id,
        httpMethod=http_method, authorizationType="NONE",
    )
    uri = (f"arn:aws:apigateway:{region}:lambda:path/2015-03-31"
           f"/functions/{fn_arn}/invocations")
    apigw.put_integration(
        restApiId=rest_api_id, resourceId=resource_id,
        httpMethod=http_method, type="AWS_PROXY",
        integrationHttpMethod="POST", uri=uri,
    )
    # CORS response headers
    apigw.put_method_response(
        restApiId=rest_api_id, resourceId=resource_id,
        httpMethod=http_method, statusCode="200",
        responseParameters={k: False for k in CORS_HEADERS},
    )

def _add_options(apigw, rest_api_id: str, resource_id: str):
    """Agrega método OPTIONS para preflight CORS."""
    try:
        apigw.put_method(
            restApiId=rest_api_id, resourceId=resource_id,
            httpMethod="OPTIONS", authorizationType="NONE",
        )
        apigw.put_integration(
            restApiId=rest_api_id, resourceId=resource_id,
            httpMethod="OPTIONS", type="MOCK",
            requestTemplates={"application/json": '{"statusCode": 200}'},
        )
        apigw.put_method_response(
            restApiId=rest_api_id, resourceId=resource_id,
            httpMethod="OPTIONS", statusCode="200",
            responseParameters={k: False for k in CORS_HEADERS},
        )
        apigw.put_integration_response(
            restApiId=rest_api_id, resourceId=resource_id,
            httpMethod="OPTIONS", statusCode="200",
            responseParameters={
                "method.response.header.Access-Control-Allow-Origin":  "'*'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,POST,DELETE,OPTIONS'",
            },
        )
    except Exception:
        pass

def _get_or_create_resource(apigw, rest_api_id: str, parent_id: str, path_part: str) -> str:
    resources = apigw.get_resources(restApiId=rest_api_id, limit=500)["items"]
    for r in resources:
        if r.get("parentId") == parent_id and r.get("pathPart") == path_part:
            return r["id"]
    return apigw.create_resource(
        restApiId=rest_api_id, parentId=parent_id, pathPart=path_part
    )["id"]

def create_api_gateway(arns: dict[str, str]) -> str:
    apigw = boto("apigateway")

    # ¿Ya existe?
    apis = apigw.get_rest_apis(limit=100)["items"]
    api_id = next((a["id"] for a in apis if a["name"] == "ecommerce-serverless"), None)
    if api_id:
        apigw.delete_rest_api(restApiId=api_id)
        time.sleep(2)
        print("  ✔ API anterior eliminada")

    api = apigw.create_rest_api(name="ecommerce-serverless", description="EcoCart API")
    api_id = api["id"]
    root_id = apigw.get_resources(restApiId=api_id)["items"][0]["id"]
    print(f"  ✔ API Gateway creado: {api_id}")

    def R(path_part, parent_id=root_id):
        return _get_or_create_resource(apigw, api_id, parent_id, path_part)

    def M(resource_id, method, fn_key):
        _add_method(apigw, api_id, resource_id, method, arns[fn_key], REGION)

    # /cart/{user_id}
    cart       = R("cart")
    cart_user  = R("{user_id}", cart)
    _add_options(apigw, api_id, cart_user)
    M(cart_user, "GET",    "EcommerceLambda-ManageUserCart")
    M(cart_user, "POST",   "EcommerceLambda-ManageUserCart")
    M(cart_user, "DELETE", "EcommerceLambda-ManageUserCart")

    # /products  /products/{product_id}
    products   = R("products")
    prod_item  = R("{product_id}", products)
    _add_options(apigw, api_id, products)
    _add_options(apigw, api_id, prod_item)
    M(products,  "GET",    "EcommerceLambda-GetAllProducts")
    M(products,  "POST",   "EcommerceLambda-ManageProducts")
    M(prod_item, "DELETE", "EcommerceLambda-ManageProducts")

    # /users  /users/{user_id}
    users      = R("users")
    user_item  = R("{user_id}", users)
    _add_options(apigw, api_id, users)
    _add_options(apigw, api_id, user_item)
    M(users,     "GET",    "EcommerceLambda-GetAllUsers")
    M(user_item, "GET",    "EcommerceLambda-GetUserProfile")

    # /user/{user_id}/profile  /user/{user_id}/orders
    user_res   = R("user")
    user_uid   = R("{user_id}", user_res)
    profile    = R("profile", user_uid)
    orders_res = R("orders", user_uid)
    _add_options(apigw, api_id, profile)
    _add_options(apigw, api_id, orders_res)
    M(profile,    "GET", "EcommerceLambda-GetUserProfile")
    M(orders_res, "GET", "EcommerceLambda-GetUserOrders")

    # /orders/{order_id}  /orders/{order_id}/items
    orders     = R("orders")
    order_id   = R("{order_id}", orders)
    items_res  = R("items", order_id)
    _add_options(apigw, api_id, order_id)
    _add_options(apigw, api_id, items_res)
    M(order_id,  "GET", "EcommerceLambda-GetOrderById")
    M(items_res, "GET", "EcommerceLambda-GetOrderItems")

    # Deploy al stage "prod"
    apigw.create_deployment(restApiId=api_id, stageName="prod")
    print("  ✔ API desplegado en stage 'prod'")

    return api_id

# ── 5. Escribir Frontend/.env ──────────────────────────────────────────────────
def write_frontend_env(api_id: str):
    vite_url = f"/localstack/restapis/{api_id}/prod/_user_request_"
    env_file = FRONTEND / ".env"
    env_file.write_text(
        "# Generado automáticamente por infrastructure/deploy.py\n"
        f"VITE_API_URL={vite_url}\n",
        encoding="utf-8",
    )
    print(f"  ✔ Frontend/.env → VITE_API_URL={vite_url}")

# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀 Desplegando infraestructura en LocalStack...")
    print(f"   Endpoint: {ENDPOINT}")

    print("\n[1/4] DynamoDB")
    create_dynamo()

    print("\n[2/4] IAM Role")
    role_arn = create_lambda_role()

    print("\n[3/4] Lambda functions")
    arns = create_lambdas(role_arn)

    print("\n[4/4] API Gateway")
    api_id = create_api_gateway(arns)

    write_frontend_env(api_id)

    print("\n✅ Deploy completado.")
    print(f"   API URL: http://localhost:4566/restapis/{api_id}/prod/_user_request_\n")
