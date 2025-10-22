# Using node.js to run react on server
FROM node:20

# Set working directory
WORKDIR /frontend

# Copy any file that has 'package' in the name and is a json file into the working direc
COPY package*.json .

# Install packages
RUN npm install

# Copy the rest of the files in 
COPY . . 

# Run React App
CMD ["npm", "start"]