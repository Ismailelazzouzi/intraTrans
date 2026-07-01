import client from 'prom-client'

const register = client.register

client.collectDefaultMetrics({
  register,
  prefix: 'hive_',
})

// ─── HTTP METRICS ─────────────────────────────────────────────────────────────

export const httpRequestsTotal = new client.Counter({
  name: 'hive_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
})

export const httpRequestDuration = new client.Histogram({
  name: 'hive_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const httpRequestSize = new client.Histogram({
  name: 'hive_http_request_size_bytes',
  help: 'Size of HTTP request bodies in bytes',
  labelNames: ['method', 'route'] as const,
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000],
})

// ─── SOCKET METRICS ───────────────────────────────────────────────────────────

export const socketConnectedClients = new client.Gauge({
  name: 'hive_socket_io_connected_clients',
  help: 'Number of currently connected Socket.IO clients',
})

export const socketClientsInRoom = new client.Gauge({
  name: 'hive_socket_io_clients_in_room',
  help: 'Number of Socket.IO clients in a specific room',
  labelNames: ['room'] as const,
})

export const socketEventsEmitted = new client.Counter({
  name: 'hive_socket_io_events_emitted_total',
  help: 'Total Socket.IO events emitted by the server',
  labelNames: ['event'] as const,
})

export const socketEventsFailed = new client.Counter({
  name: 'hive_socket_io_events_failed_total',
  help: 'Total Socket.IO events that failed to emit',
  labelNames: ['event'] as const,
})

// ─── BUSINESS METRICS ─────────────────────────────────────────────────────────

export const broadcastsCreated = new client.Counter({
  name: 'hive_broadcasts_created_total',
  help: 'Total broadcasts created',
  labelNames: ['type'] as const,
})

export const activeBroadcasts = new client.Gauge({
  name: 'hive_active_broadcasts',
  help: 'Current number of broadcasts by status',
  labelNames: ['status'] as const,
})

export const broadcastResponses = new client.Counter({
  name: 'hive_broadcast_responses_total',
  help: 'Total broadcast responses',
  labelNames: ['result'] as const,
})

export const providerConfirmations = new client.Counter({
  name: 'hive_provider_confirmations_total',
  help: 'Total provider confirmations',
  labelNames: ['broadcast_type'] as const,
})

export const authOperations = new client.Counter({
  name: 'hive_auth_operations_total',
  help: 'Total authentication operations',
  labelNames: ['operation', 'result'] as const,
})

export const adminActions = new client.Counter({
  name: 'hive_admin_actions_total',
  help: 'Total admin actions',
  labelNames: ['action'] as const,
})

export const usersTotal = new client.Gauge({
  name: 'hive_users_total',
  help: 'Current total users by type',
  labelNames: ['type'] as const,
})

// ─── DATABASE METRICS ─────────────────────────────────────────────────────────

export const prismaQueryDuration = new client.Histogram({
  name: 'hive_prisma_query_duration_seconds',
  help: 'Duration of Prisma queries in seconds',
  labelNames: ['model', 'operation'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
})

export const prismaQueryTotal = new client.Counter({
  name: 'hive_prisma_query_total',
  help: 'Total Prisma queries',
  labelNames: ['model', 'operation', 'success'] as const,
})

export { register }