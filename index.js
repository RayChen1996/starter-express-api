//mongodb+srv://ray10315332:GayqbQeJq5Jxh3em@cluster0.pberq7k.mongodb.net/

const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const mongoose = require("mongoose");
const { AuthenticationError } = require("apollo-server-errors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path"); // Ensure to include the 'path' module

async function startServer() {
  const app = express();

  mongoose.connect("mongodb://127.0.0.1/HabitWebDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const userSchema = new mongoose.Schema({
    username: String,
    password: String,
  });

  const scheduleSchema = new mongoose.Schema({
    userId: mongoose.Types.ObjectId,
    todo: String,
  });

  const UserModel = mongoose.model("User", userSchema);
  const ScheduleModel = mongoose.model("Schedule", scheduleSchema);

  const typeDefs = gql`
    type User {
      id: ID!
      username: String!
    }

    type Schedule {
      id: ID!
      userId: ID!
      todo: String!
    }

    type AuthPayload {
      token: String!
      user: User!
    }

    type Query {
      me: User
      getSchedule: [Schedule]
    }

    type Mutation {
      register(username: String!, password: String!): AuthPayload
      login(username: String!, password: String!): AuthPayload
      addSchedule(todo: String!): Schedule
    }
  `;

  const resolvers = {
    Query: {
      me: (parent, args, context) => {
        if (!context.user) {
          throw new AuthenticationError("Not authenticated");
        }
        return context.user;
      },
      getSchedule: async (parent, args, context) => {
        if (!context.user) {
          throw new AuthenticationError("Not authenticated");
        }
        return ScheduleModel.find({ userId: context.user.id });
      },
    },
    Mutation: {
      register: async (parent, { username, password }) => {
        const passwordRegex = /^[A-Z].{5,}$/;
        if (!passwordRegex.test(password)) {
          throw new AuthenticationError(
            "Password must start with an uppercase letter and be at least 6 characters long"
          );
        }

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
          throw new AuthenticationError("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({ username, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign(
          { id: newUser.id, username: newUser.username },
          "your-secret-key",
          {
            expiresIn: "1d",
          }
        );

        return { token, user: { id: newUser.id, username: newUser.username } };
      },
      login: async (parent, { username, password }) => {
        const user = await UserModel.findOne({ username });
        if (!user) {
          throw new AuthenticationError("Invalid username or password");
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          throw new AuthenticationError("Invalid username or password");
        }

        const token = jwt.sign(
          { id: user.id, username: user.username },
          "your-secret-key",
          {
            expiresIn: "1d",
          }
        );

        return { token, user: { id: user.id, username: user.username } };
      },
      addSchedule: async (parent, { todo }, context) => {
        if (!context.user) {
          throw new AuthenticationError("Not authenticated");
        }

        const newSchedule = new ScheduleModel({
          userId: context.user.id,
          todo,
        });
        await newSchedule.save();

        return newSchedule;
      },
    },
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || "";
      try {
        const user = jwt.verify(token, "your-secret-key");
        return { user };
      } catch (error) {
        return {};
      }
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  // Add a route for the GraphQL Playground
  app.get("/playground", (req, res) => {
    res.sendFile(path.join(__dirname, "public/playground.html"));
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(
      `Server is running at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer().catch((error) => console.error(error));
