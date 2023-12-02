const { ApolloServer, gql } = require("apollo-server");
 
const mongoose = require("mongoose");

const cron = require("node-cron");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const typeDefs = require("./schema/type");
// const mongoose = require("mongoose");
require("dotenv").config();
const uri =
  "mongodb+srv://ray10315332:GayqbQeJq5Jxh3em@cluster0.pberq7k.mongodb.net/";
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
  
  // Schedule the task to run every day at midnight (00:00)
  cron.schedule("0 0 * * *", () => {
    clearDataTable();
  });


const connection = mongoose.connection;

connection.once("open", () => {
  console.log("mogoose connect!!!");
});
const User = mongoose.model('User', {
  email: String,
  password: String,
});


const Habitgoals = mongoose.model('habitgoals', {
    Goal: String,
    type: Number,
    frequency:String,
    fine: Number,
    note:String,
    SDate:String,
    EDate:String
  });
// 定义GraphQL Schema
const typeDefs = gql`
  type Todo {
    id: ID!
    task: String!
    completed: Boolean!
  }



  type Habits {
    id: ID!
    Goal: String!
    type: Int!
    frequency:String!
    fine: Int!
    note:String!
    SDate:String!
    EDate:String
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
        Habits:[Habits]
    }

    type Mutation {
        register(email: String!, password: String!): AuthPayload
        login(email: String!, password: String!): AuthPayload
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
        console.log('Executing users resolver');
        return User.find();
      } catch (error) {
        console.error('Error in users resolver:', error);
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
          console.error('Error deleting habits:', error);
          throw error;
        }
      },
    addHabitGoal: async (_, { Goal }) => {
        const habit = new Habitgoals({  Goal  });
        await habit.save();
        return habit;
    },
  },
};

// 5. 连接到 MongoDB 数据库
mongoose.connect(
  "mongodb+srv://ray10315332:GayqbQeJq5Jxh3em@cluster0.pberq7k.mongodb.net/",
  {
    useUnifiedTopology: true,
  }
);

// 6. 定义 Todo 模型
const Todo = mongoose.model("Todo", {
  task: String,
  completed: Boolean,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  
  persistedQueries: false,
  playground: true,
});

 

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server is ${url}`);
});
