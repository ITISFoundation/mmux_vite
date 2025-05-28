
FROM node:24-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN echo 'VITE_PYTHON_DAKOTA_BACKEND=http://172.18.0.3:5000' > ./.env

RUN echo $(ls -lan)

EXPOSE 8080

CMD [ "npm", "run", "dev" ]