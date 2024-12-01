# Usa una imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /

# Instala el CLI de NestJS globalmente
RUN npm install -g @nestjs/cli

# Copia los archivos del proyecto
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install --only=production

COPY . .

RUN npm run build

RUN npm prune --production

# Expone el puerto en el que correrá la aplicación
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]
