FROM node:18-alpine

WORKDIR /app

# Copia manifestos e o schema do Prisma antes do install,
# pois o "postinstall" roda "prisma generate" e precisa do schema.
COPY package*.json ./
COPY prisma ./prisma

RUN npm install --production

COPY . .

EXPOSE 3001

# "npm start" roda "prisma migrate deploy" antes de subir o servidor.
CMD ["npm", "start"]
