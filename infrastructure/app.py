import aws_cdk as cdk
from stacks.dynamo_stack import DynamoStack
from stacks.redis_stack import RedisStack
from stacks.lambda_stack import LambdaStack

app = cdk.App()

dynamo = DynamoStack(app, "EcommerceDynamo")
redis  = RedisStack(app, "EcommerceRedis")
LambdaStack(app, "EcommerceLambda",
            dynamo_table=dynamo.table,
            redis_host=redis.redis_host,
            redis_port=redis.redis_port)

app.synth()