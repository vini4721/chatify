variable "namespace" {
  description = "Kubernetes namespace for Chatify"
  type        = string
  default     = "chatify"
}

variable "app_image" {
  description = "Container image for the Chatify app"
  type        = string
  default     = "chatify:latest"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "client_url" {
  description = "Public URL of the app (CORS / emails)"
  type        = string
  default     = "http://localhost:3000"
}
