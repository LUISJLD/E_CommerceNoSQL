#!/usr/bin/env python3
"""
update-env.py
─────────────
Lee los outputs del stack EcommerceLambda en LocalStack y actualiza
automáticamente el archivo Frontend/.env con la URL correcta del API Gateway.

Soporta dos formatos de output que CDK puede generar:
  - "ApiGatewayUrl"            → http://localhost:4566/restapis/<id>/prod/_user_request_
  - "EcommerceApiEndpoint*"    → https://<id>.execute-api.localhost.localstack.cloud:4566/prod/

En ambos casos construye la URL del proxy de Vite (/localstack/restapis/...).

Uso:
    python update-env.py
    python update-env.py --endpoint http://localhost:4566
"""

import boto3
import argparse
import re
import sys
from pathlib import Path

STACK_NAME = "EcommerceLambda"
ENV_FILE   = Path(__file__).parent.parent / "Frontend" / ".env"

# Patrón para extraer el API ID del formato HTTPS de LocalStack:
# https://<api-id>.execute-api.localhost.localstack.cloud:4566/prod/
LOCALSTACK_HTTPS_RE = re.compile(
    r"https://([a-z0-9]+)\.execute-api\.localhost\.localstack\.cloud:\d+/(\w+)/?"
)


def get_outputs(endpoint: str) -> dict:
    cf = boto3.client(
        "cloudformation",
        endpoint_url=endpoint,
        region_name="us-east-1",
        aws_access_key_id="local",
        aws_secret_access_key="local",
    )
    try:
        response = cf.describe_stacks(StackName=STACK_NAME)
    except Exception as e:
        print(f"❌ No se pudo consultar el stack '{STACK_NAME}': {e}")
        sys.exit(1)

    stacks = response.get("Stacks", [])
    if not stacks:
        print(f"❌ Stack '{STACK_NAME}' no encontrado.")
        sys.exit(1)

    return {o["OutputKey"]: o["OutputValue"] for o in stacks[0].get("Outputs", [])}


def resolve_vite_url(outputs: dict) -> str:
    """
    Convierte cualquier output del stack en la URL relativa para el proxy de Vite.
    Retorna algo como: /localstack/restapis/<id>/prod/_user_request_
    """

    # Caso 1: output explícito que agregamos en lambda_stack.py
    # Valor: http://localhost:4566/restapis/<id>/prod/_user_request_
    if "ApiGatewayUrl" in outputs:
        url = outputs["ApiGatewayUrl"]
        return url.replace("http://localhost:4566", "/localstack")

    # Caso 2: output automático de CDK (RestApi.url)
    # Valor: https://<id>.execute-api.localhost.localstack.cloud:4566/prod/
    for key, value in outputs.items():
        if "Endpoint" in key or "ApiUrl" in key or "Url" in key:
            match = LOCALSTACK_HTTPS_RE.match(value)
            if match:
                api_id = match.group(1)
                stage  = match.group(2)
                return f"/localstack/restapis/{api_id}/{stage}/_user_request_"

    print("❌ No se encontró ningún output de API Gateway en el stack.")
    print("   Outputs disponibles:", list(outputs.keys()))
    sys.exit(1)


def update_env_file(vite_url: str) -> None:
    content = (
        "# Generado automáticamente por infrastructure/update-env.py\n"
        "# No editar a mano — se sobreescribe en cada deploy\n"
        "#\n"
        "# API Gateway de LocalStack, proxied por Vite para evitar CORS.\n"
        "# El proxy en vite.config.ts reescribe /localstack/... → http://localhost:4566/...\n"
        f"VITE_API_URL={vite_url}\n"
    )
    ENV_FILE.write_text(content, encoding="utf-8")
    print(f"✅ {ENV_FILE} actualizado:")
    print(f"   VITE_API_URL={vite_url}")


def main():
    parser = argparse.ArgumentParser(
        description="Actualiza el .env del frontend con la URL del API Gateway de LocalStack."
    )
    parser.add_argument(
        "--endpoint",
        default="http://localhost:4566",
        help="Endpoint de LocalStack (default: http://localhost:4566)",
    )
    args = parser.parse_args()

    print(f"🔍 Consultando stack '{STACK_NAME}' en {args.endpoint}...")
    outputs = get_outputs(args.endpoint)
    print(f"   Outputs encontrados: {list(outputs.keys())}")

    vite_url = resolve_vite_url(outputs)
    update_env_file(vite_url)


if __name__ == "__main__":
    main()
