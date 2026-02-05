/**
 * EUSOTRIP DEPLOYMENT CONFIGURATION
 * Production deployment settings for various platforms
 */

module.exports = {
  // Application settings
  app: {
    name: 'eusotrip',
    version: require('./package.json').version,
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  // SSL/TLS Configuration
  ssl: {
    enabled: process.env.NODE_ENV === 'production',
    // For custom SSL certificates (when not using cloud provider's SSL)
    certPath: process.env.SSL_CERT_PATH || '/etc/ssl/certs/eusotrip.crt',
    keyPath: process.env.SSL_KEY_PATH || '/etc/ssl/private/eusotrip.key',
    caPath: process.env.SSL_CA_PATH || '/etc/ssl/certs/ca-bundle.crt',
  },

  // Health check endpoints
  healthCheck: {
    path: '/health',
    liveness: '/health/live',
    readiness: '/health/ready',
    timeout: 5000,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
  },

  // Docker configuration
  docker: {
    image: 'eusotrip/app',
    tag: process.env.DOCKER_TAG || 'latest',
    registry: process.env.DOCKER_REGISTRY || 'docker.io',
    port: 3000,
    healthcheck: {
      interval: '30s',
      timeout: '10s',
      retries: 3,
      startPeriod: '60s',
    },
  },

  // Kubernetes configuration
  kubernetes: {
    namespace: process.env.K8S_NAMESPACE || 'eusotrip',
    replicas: {
      min: 2,
      max: 10,
    },
    resources: {
      requests: {
        cpu: '250m',
        memory: '512Mi',
      },
      limits: {
        cpu: '1000m',
        memory: '2Gi',
      },
    },
    autoscaling: {
      targetCPUUtilization: 70,
      targetMemoryUtilization: 80,
    },
  },

  // AWS deployment
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    ecs: {
      cluster: 'eusotrip-production',
      service: 'eusotrip-app',
      taskDefinition: 'eusotrip-task',
    },
    alb: {
      healthCheckPath: '/health',
      healthCheckInterval: 30,
      healthCheckTimeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
    },
    cloudfront: {
      enabled: true,
      priceClass: 'PriceClass_All',
      ttl: {
        default: 86400,
        max: 31536000,
        min: 0,
      },
    },
  },

  // Azure deployment
  azure: {
    region: process.env.AZURE_REGION || 'eastus',
    appService: {
      plan: 'eusotrip-plan',
      sku: 'P2v3',
    },
    containerApps: {
      environment: 'eusotrip-env',
      revision: 'eusotrip-app',
    },
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    outputs: ['console', 'file'],
    file: {
      path: '/var/log/eusotrip',
      maxSize: '100m',
      maxFiles: 10,
      compress: true,
    },
  },

  // Monitoring
  monitoring: {
    enabled: true,
    metrics: {
      path: '/metrics',
      prefix: 'eusotrip_',
    },
    tracing: {
      enabled: process.env.TRACING_ENABLED === 'true',
      samplingRate: 0.1,
    },
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: {
      default: 300, // 5 minutes
      static: 86400, // 1 day
      api: 60, // 1 minute
    },
    headers: {
      static: 'public, max-age=31536000, immutable',
      dynamic: 'private, no-cache, no-store, must-revalidate',
    },
  },

  // Graceful shutdown
  shutdown: {
    timeout: 30000, // 30 seconds
    signals: ['SIGTERM', 'SIGINT'],
  },
};
