resource "kubernetes_namespace_v1" "chatify" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/part-of" = "chatify"
    }
  }
}

resource "kubernetes_secret_v1" "app" {
  metadata {
    name      = "chatify-secrets"
    namespace = kubernetes_namespace_v1.chatify.metadata[0].name
  }

  data = {
    JWT_SECRET = base64encode(var.jwt_secret)
  }
}

resource "kubernetes_config_map_v1" "app" {
  metadata {
    name      = "chatify-config"
    namespace = kubernetes_namespace_v1.chatify.metadata[0].name
  }

  data = {
    NODE_ENV  = "production"
    PORT      = "3000"
    MONGO_URI = "mongodb://mongo:27017/chat_app"
    CLIENT_URL = var.client_url
  }
}

resource "kubernetes_deployment_v1" "mongo" {
  metadata {
    name      = "mongo"
    namespace = kubernetes_namespace_v1.chatify.metadata[0].name
    labels    = { app = "mongo" }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { app = "mongo" }
    }

    template {
      metadata {
        labels = { app = "mongo" }
      }

      spec {
        container {
          name  = "mongo"
          image = "mongo:7"

          port {
            container_port = 27017
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "mongo" {
  metadata {
    name      = "mongo"
    namespace = kubernetes_namespace_v1.chatify.metadata[0].name
  }

  spec {
    selector = { app = "mongo" }

    port {
      port        = 27017
      target_port = 27017
    }
  }
}

resource "kubernetes_deployment_v1" "app" {
  metadata {
    name      = "chatify"
    namespace = kubernetes_namespace_v1.chatify.metadata[0].name
    labels    = { app = "chatify" }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { app = "chatify" }
    }

    template {
      metadata {
        labels = { app = "chatify" }
      }

      spec {
        container {
          name              = "chatify"
          image             = var.app_image
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 3000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map_v1.app.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret_v1.app.metadata[0].name
            }
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 20
            period_seconds        = 20
          }
        }
      }
    }
  }

  depends_on = [kubernetes_deployment_v1.mongo]
}

resource "kubernetes_service_v1" "app" {
  metadata {
    name      = "chatify"
    namespace = kubernetes_namespace_v1.chatify.metadata[0].name
  }

  spec {
    type     = "LoadBalancer"
    selector = { app = "chatify" }

    port {
      port        = 80
      target_port = 3000
    }
  }
}
