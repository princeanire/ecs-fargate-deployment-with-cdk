export interface FargateServiceConfig {
  SERVICE_NAME: string;
  CPU: number;
  MEMORY_LIMIT: number;
  CONTAINER_PORT: number;
  IMAGE_TAG: string;
  DESIRED_FARGATE_TASK_COUNT: number;
  MINIMUM_FARGATE_TASK_COUNT: number;
  MAXIMUM_FARGATE_TASK_COUNT: number;
  TARGET_CPU_UTILIZATION_PERCENT: number,
  REQUEST_PRIORITY: number;
  PATH_PATTERNS: string[];
  HEALTH_CHECK_HTTP_CODES: string;
  HEALTH_CHECK_PATH: string;
}