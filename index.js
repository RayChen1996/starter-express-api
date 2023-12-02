// const express = require('express')
// const app = express()
// app.all('/', (req, res) => {
//     console.log("Just got a request!")
//     res.send('Yo!')
// })
// app.listen(process.env.PORT || 3000)

const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function startServer() {
  const app = express();

  // Replace 'your_connection_string' with your actual MongoDB connection string
  await mongoose.connect('mongodb+srv://ray10315332:GayqbQeJq5Jxh3em@cluster0.pberq7k.mongodb.net', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const User = mongoose.model('User', {
    email: String,
    password: String,
  });

  const typeDefs = gql`
    type User {
      id: ID!
      email: String!
    }

    type AuthPayload {
      token: String!
    }

    type Query {
      users: [User]
    }

    type Mutation {
      register(email: String!, password: String!): AuthPayload
      login(email: String!, password: String!): AuthPayload
    }
  `;

  const resolvers = {
    Query: {
      users: () => User.find(),
    },
    Mutation: {
      register: async (_, { email, password }) => {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '7d' });

        return { token };
      },
      login: async (_, { email, password }) => {
        const user = await User.findOne({ email });

        if (!user) {
          throw new Error('Invalid login credentials');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          throw new Error('Invalid login credentials');
        }

        const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '7d' });

        return { token };
      },
    },
  };

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
