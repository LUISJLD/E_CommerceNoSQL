from aws_cdk import Stack, CfnOutput
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_elasticache as elasticache
from constructs import Construct
import os


class RedisStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        #  Detectar si estamos en LocalStack
        is_local = True

        if is_local:
            # ──────────────────────────────────────────────
            #  MODO LOCAL (Docker Redis)
            # ──────────────────────────────────────────────
            self.redis_host = "redis_cache"
            self.redis_port = "6379"

            CfnOutput(self, "RedisEndpoint",
                value=f"{self.redis_host}:{self.redis_port}",
                description="Redis local (Docker)",
            )

        else:
            # ──────────────────────────────────────────────
            #  MODO AWS REAL (ElastiCache)
            # ──────────────────────────────────────────────

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

            subnet_group = elasticache.CfnSubnetGroup(
                self, "RedisSubnetGroup",
                description="Subnets para Redis cluster",
                subnet_ids=[s.subnet_id for s in vpc.isolated_subnets],
            )

            self.cluster = elasticache.CfnCacheCluster(
                self, "RedisCluster",
                cache_node_type="cache.t3.micro",
                engine="redis",
                num_cache_nodes=1,
                cluster_name="ecommerce-redis",
                vpc_security_group_ids=[sg.security_group_id],
                cache_subnet_group_name=subnet_group.ref,
            )

            self.redis_host = self.cluster.attr_redis_endpoint_address
            self.redis_port = self.cluster.attr_redis_endpoint_port

            CfnOutput(self, "RedisEndpoint",
                value=f"{self.redis_host}:{self.redis_port}",
                description="Redis endpoint AWS",
            )