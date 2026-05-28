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
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,DELETE",
    "Content-Type": "application/json",
}


def response(status_code: int, body):
    """Respuesta con body JSON. `default=str` serializa Decimal y datetime."""
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def no_content():
    """204: sin body, pero con cabeceras CORS igualmente."""
    return {
        "statusCode": 204,
        "headers": CORS_HEADERS,
        "body": "",
    }