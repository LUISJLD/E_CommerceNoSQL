import aws_cdk as cdk
from stacks.dynamo_stack import DynamoStack
from stacks.redis_stack import RedisStack
from stacks.lambda_stack import LambdaStack

# LocalStack no valida account/región reales; usamos valores ficticios fijos.
local_env = cdk.Environment(account="000000000000", region="us-east-1")

app = cdk.App()

dynamo = DynamoStack(app, "EcommerceDynamo", env=local_env)
redis  = RedisStack(app, "EcommerceRedis",   env=local_env)
LambdaStack(app, "EcommerceLambda",
            dynamo_table=dynamo.table,
            redis_host=redis.redis_host,
            redis_port=redis.redis_port,
            env=local_env)

app.synth()