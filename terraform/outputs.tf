output "namespace" {
  description = "Deployed namespace"
  value       = kubernetes_namespace_v1.chatify.metadata[0].name
}

output "app_service" {
  description = "Chatify Kubernetes service name"
  value       = kubernetes_service_v1.app.metadata[0].name
}
