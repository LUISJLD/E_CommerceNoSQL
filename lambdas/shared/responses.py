"""
responses.py
────────────
Helper centralizado para construir respuestas HTTP de las Lambdas.

Garantiza que TODAS las respuestas — incluidas las de error — lleven las
cabeceras CORS. Sin esto, un fallo 500 le llega al navegador como
"blocked by CORS policy" en lugar del error real, y se depura un fantasma.
"""
import json

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
    "Content-Type": "application/json",
}


def response(status_code: int, body, extra_headers: dict | None = None):
    """Respuesta con body JSON. `default=str` serializa Decimal y datetime."""
    headers = {**CORS_HEADERS, **(extra_headers or {})}
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(body, default=str),
    }


def cached_response(status_code: int, cache_result: dict):
    """Respuesta con header X-Cache-Source a partir del resultado de cache_aside."""
    source = cache_result.get("source", "DATABASE")
    data = cache_result.get("data", cache_result)
    return response(status_code, data, {"X-Cache-Source": source})


def no_content():
    """204: sin body, pero con cabeceras CORS igualmente."""
    return {
        "statusCode": 204,
        "headers": CORS_HEADERS,
        "body": "",
    }