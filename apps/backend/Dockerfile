COPY package.json package-lock.json ./
RUN npm ci                  # installs ALL dependencies including dev
COPY . .
RUN npm run build           # produces .medusa/server/