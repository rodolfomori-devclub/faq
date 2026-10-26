FROM node:18-alpine

WORKDIR /app

# Prisma precisa do OpenSSL para detectar a engine correta no Alpine (musl).
# Sem isso: "failed to detect libssl/openssl version" + engine quebra.
RUN apk add --no-cache openssl libc6-compat

# Copia manifestos e o schema do Prisma antes do install,
# pois o "postinstall" roda "prisma generate" e precisa do schema.
COPY package*.json ./
COPY prisma ./prisma

RUN npm install --production

COPY . .

EXPOSE 3001

# "npm start" roda "prisma migrate deploy" antes de subir o servidor.
CMD ["npm", "start"]
