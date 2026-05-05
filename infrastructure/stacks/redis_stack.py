from aws_cdk import Stack, Duration, CfnOutput
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_elasticache as elasticache
from constructs import Construct


class RedisStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # ──────────────────────────────────────────────
        # NOTA: LocalStack Free Tier no emula ElastiCache.
        # Este stack define la infra real para AWS.
        # En desarrollo local, Redis corre via Docker
        # (ya definido en docker-compose.yml).
        # ──────────────────────────────────────────────

        # VPC mínima para alojar el cluster
        vpc = ec2.Vpc(self, "RedisVpc",
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                )
            ]
        )

        # Security group — solo acceso desde Lambdas en la misma VPC
        sg = ec2.SecurityGroup(self, "RedisSG",
            vpc=vpc,
            description="Redis cache security group",
            allow_all_outbound=False,
        )
        sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(6379),
            description="Lambda access to Redis",
        )

        # Subnet group requerido por ElastiCache
        subnet_group = elasticache.CfnSubnetGroup(
            self, "RedisSubnetGroup",
            description="Subnets para Redis cluster",
            subnet_ids=[s.subnet_id for s in vpc.isolated_subnets],
        )

        # Cluster Redis single-node (dev) — cambiar num_cache_nodes
        # a 2+ y habilitar multi_az para producción
        self.cluster = elasticache.CfnCacheCluster(
            self, "RedisCluster",
            cache_node_type="cache.t3.micro",   # Free Tier eligible
            engine="redis",
            num_cache_nodes=1,
            cluster_name="ecommerce-redis",
            vpc_security_group_ids=[sg.security_group_id],
            cache_subnet_group_name=subnet_group.ref,
        )

        # Exponer el endpoint para usarlo en LambdaStack
        self.redis_host = self.cluster.attr_redis_endpoint_address
        self.redis_port = self.cluster.attr_redis_endpoint_port

        CfnOutput(self, "RedisEndpoint",
            value=f"{self.redis_host}:{self.redis_port}",
            description="Redis endpoint para las Lambdas",
        )