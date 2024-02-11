//mongodb+srv://ray10315332:GayqbQeJq5Jxh3em@cluster0.pberq7k.mongodb.net/

const { ApolloServer, gql } = require("apollo-server");

const mongoose = require("mongoose");
const axios = require('axios');

const cron = require("node-cron");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const typeDefs = require("./schema/type");
// const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const clearDataTable = async () => {
  try {
    // Clear the data table, adjust the model name accordingly
    await Habitgoals.deleteMany({});
    console.log("Data table cleared at midnight");
  } catch (error) {
    console.error("Error clearing data table:", error);
  }
};

const clearTodoCollection = async () => {
  try {
    // Clear the data table, adjust the model name accordingly
    await Todo.deleteMany({});
    console.log("Data TodoCollection cleared at midnight");
  } catch (error) {
    console.error("Error clearing TodoCollection  :", error);
  }
};

// Schedule the task to run every day at midnight (00:00)
// cron.schedule("0 0 * * *", () => {
 
// });
cron.schedule("55 23 * * *", () => {
  console.log("執行任務")
  clearDataTable();
  clearTodoCollection();
});
const connection = mongoose.connection;

connection.once("open", () => {
  console.log("mogoose connect!!!");
});
const UserModel = mongoose.model("Users", {
  username: String,
  password: String,
});

const Habitgoals = mongoose.model("habitgoals", {
  Goal: String,
  type: Number,
  frequency: String,
  fine: Number,
  note: String,
  SDate: String,
  EDate: String,
});

// 定义GraphQL Schema
const typeDefs = gql`
  type Todo {
    id: ID!
    task: String!
    completed: Boolean!
  }
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
    analyzeEntities(text: String!): [Entity]
  }
  type Entity {
    name: String
    type: String
    salience: Float
  }
  type Habits {
    id: ID!
    Goal: String!
    type: Int!
    frequency: String!
    fine: Int!
    note: String!
    SDate: String!
    EDate: String
  }

  type User {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
  }

  type Query {
    users: [User]
    todos: [Todo]
    todo(id: ID!): Todo
    Habits: [Habits]
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    addSchedule(todo: String!): Schedule

    addTodo(task: String!): Todo
    updateTodo(id: ID!, task: String!, completed: Boolean!): Todo
    deleteTodo(id: ID!): Todo
    addHabitGoal(Goal: String!): Habits
    deleteHabits: [Habits]
  }
`;

// 4. 提供解析函数
const resolvers = {
  Query: {
    users: () => {
      try {
        console.log("Executing users resolver");
        return User.find();
      } catch (error) {
        console.error("Error in users resolver:", error);
        throw error; // Re-throw the error to ensure it's propagated
      }
    },
    todos: async () => {
      const todos = await Todo.find();
      return todos;
    },
    todo: async (_, { id }) => {
      const todo = await Todo.findById(id);
      return todo;
    },
    Habits: async () => {
      const habits = await Habitgoals.find();
      return habits;
    },
    analyzeEntities: async (_, { text }) => {
      try {
        // Your existing code for making the API request to Cloud Natural Language API
        const apiUrl = 'https://content-language.googleapis.com/v2/documents:analyzeEntities';
        const apiKey = process.env.GOOGLE_APIKEY;

        const response = await axios.post(`${apiUrl}?key=${apiKey}`, {
          document: {
            content: text,
            type: 'PLAIN_TEXT',
          },
        });

        // Extract and format relevant data from the API response
        const entities = response.data.entities.map(entity => ({
          name: entity.name,
          type: entity.type,
          salience: entity.salience,
        }));

        return entities;
      } catch (error) {
        console.error('Error analyzing entities:', error);
        throw error;
      }
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
    addTodo: async (_, { task }) => {
      const todo = new Todo({ task, completed: false });
      await todo.save();
      return todo;
    },
    updateTodo: async (_, { id, task, completed }) => {
      const todo = await Todo.findByIdAndUpdate(
        id,
        { task, completed },
        { new: true }
      );
      return todo;
    },
    deleteTodo: async (_, { id }) => {
      const todo = await Todo.findByIdAndDelete(id);
      return todo;
    },
    deleteHabits: async () => {
      try {
        const deletedHabits = await Habitgoals.deleteMany({});
        return deletedHabits;
      } catch (error) {
        console.error("Error deleting habits:", error);
        throw error;
      }
    },
    addHabitGoal: async (_, { Goal }) => {
      const habit = new Habitgoals({ Goal });
      await habit.save();
      return habit;
    },
  },
};
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const scheduleSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  todo: String,
});

// 5. 连接到 MongoDB 数据库
mongoose.connect(
  uri,
  {
    useUnifiedTopology: true,
  }
);

// 6. 定义 Todo 模型
const Todo = mongoose.model("Todo", {
  task: String,
  completed: Boolean,
});

const ScheduleModel = mongoose.model("Schedule", scheduleSchema);

const server = new ApolloServer({
  typeDefs,
  resolvers,

  persistedQueries: false,
  playground: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server is ${url}`);
});
