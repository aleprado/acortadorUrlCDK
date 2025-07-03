# Acortador de URL con AWS CDK

Este proyecto implementa una infraestructura para un servicio de acortador de URLs utilizando AWS CDK . ECS Fargate, DynamoDB, ECR, Cloudwatch, etc.

## Requisitos previos
- Node.js y npm
- AWS CLI configurado (`aws configure`)

## Instalación
1. Clona el repositorio:
   ```bash
   git clone <URL_DEL_REPO>
   cd acortadorUrlCDK
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Despliegue de la infraestructura
1. 
   ```bash
   npm run build
   npx cdk deploy

   ```

## Variables de entorno
El servicio utiliza variables de entorno para su configuración, incluyendo:
- `ENV`: Nombre del entorno (dev, prod, etc.)
- `LOG_LEVEL`: Nivel de logs
- `TTL_DAYS`: ttl de los registros de ddb
- `DDB_TABLE`: Nombre de la tabla de ddb (auto generado)
- `BASE_URL`: URL base del servicio (DNS del Load Balancer) + El path del endpoint de para resolver la url generada
- `PORT`: Puerto de la aplicación (80 por defecto)

Estas variables se inyectan automáticamente desde la infraestructura CDK.

## Estructura del proyecto
- `lib/`: stacks de cloudformation
- `app.ts/`: archivo main del proyecto

## Despliegue
- El pipeline de CI/CD está configurado para desplegar automáticamente nuevas imágenes desde ECR a ECS.
