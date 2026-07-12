import json
import logging
from shared.dynamo_client import get_table
from shared.responses import response
from shared.auth_utils import require_admin
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

def _handle_get(table):
    # En un sistema grande no haríamos scan, tendríamos un GSI para "todas las ordenes"
    # por fecha o estado. Aquí usamos scan de los metadatos para simplificar.
    resp = table.scan(
        FilterExpression="begins_with(sk, :sk_prefix)",
        ExpressionAttributeValues={":sk_prefix": "ORDER#"}
    )
    items = resp.get("Items", [])
    
    # Limpiar tipos Decimal
    for item in items:
        if "total" in item:
            item["total"] = float(item["total"])
            
    # Ordenar por fecha descendente
    items.sort(key=lambda x: x.get("date", x.get("createdAt", "")), reverse=True)
    
    return response(200, items)

def _handle_put_status(table, order_id, body):
    new_status = body.get("status")
    if not new_status:
        return response(400, {"error": "Se requiere el nuevo status"})
        
    # Buscar el PK de la orden usando el GSI1 (que tiene gsi1pk = ORDER#<id>)
    resp = table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("gsi1pk").eq(f"ORDER#{order_id}") & Key("gsi1sk").eq("METADATA")
    )
    
    if not resp.get("Items"):
        return response(404, {"error": "Orden no encontrada"})
        
    order = resp["Items"][0]
    user_pk = order["pk"] # USER#<user_id>
    
    # Actualizar la orden en la tabla principal
    res = table.update_item(
        Key={"pk": user_pk, "sk": f"ORDER#{order_id}"},
        UpdateExpression="SET #s = :status",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":status": new_status},
        ReturnValues="ALL_NEW"
    )
    
    updated = res.get("Attributes", {})
    if "total" in updated:
        updated["total"] = float(updated["total"])
        
    return response(200, {"message": "Estado actualizado", "order": updated})


@require_admin
def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        body = json.loads(event.get("body") or "{}")
        path_params = event.get("pathParameters") or {}
        order_id = path_params.get("order_id") or path_params.get("id")
        
        table = get_table()

        if http_method == "GET":
            return _handle_get(table)
        elif http_method == "PUT" and order_id:
            # PUT /admin/orders/{id}/status
            # Nota: CDK mapeó esto como {id}/status. Así que solo validamos el ID.
            return _handle_put_status(table, order_id, body)
            
        return response(405, {"error": "Método no permitido"})

    except Exception as e:
        logging.exception("Error en manage_orders")
        return response(500, {"error": f"Internal server error: {str(e)}"})
