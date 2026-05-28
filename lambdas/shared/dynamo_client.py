import boto3, os

def get_table():
    kwargs = {
        "region_name": os.environ.get("APP_REGION", "us-east-1"),
    }

    endpoint = os.environ.get("DYNAMODB_ENDPOINT_URL")
    if endpoint:
        kwargs["endpoint_url"] = endpoint
        kwargs["aws_access_key_id"] = "local"
        kwargs["aws_secret_access_key"] = "local"

    resource = boto3.resource("dynamodb", **kwargs)
    return resource.Table(os.environ.get("TABLE_NAME", "Ecommerce"))