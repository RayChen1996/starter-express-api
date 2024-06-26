const { ApolloServer, gql } = require("apollo-server");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
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
const app = express();
app.use(bodyParser.json());
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
const fetchReq = async () => {
  try {
    // 在這裡添加你的 API endpoint 和相應的 request 設定
    const response = await axios.get(
      "https://node-typescript-server-749q.onrender.com"
    );
    console.log("Request sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending request:", error.message);
  }
};
cron.schedule("0  * * * *", () => {
  fetchReq();
});
cron.schedule("55 23 * * *", () => {
  console.log("執行任務");
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

const questionSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const Question = mongoose.model("Question", questionSchema);

const contactFormSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});
const ContactForm = mongoose.model("ContactForm", contactFormSchema);

const templateSchema = new mongoose.Schema({
  name: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Template = mongoose.model("Template", templateSchema);
const forumPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ForumPost = mongoose.model("ForumPost", forumPostSchema);

const healthRecordSchema = new mongoose.Schema({
  description: String,
  date: Date,
  reminder: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const HealthRecord = mongoose.model("HealthRecord", healthRecordSchema);

const expenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  date: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Expense = mongoose.model("Expense", expenseSchema);
// 定义 HouseSymptoms 模型
const houseSymptomsSchema = new mongoose.Schema({
  labelName: String,
  createDT: {
    type: Date,
    default: Date.now,
  },
  updateDT: {
    type: Date,
    default: Date.now,
  },
});

const HouseSymptoms = mongoose.model("HouseSymptoms", houseSymptomsSchema);
const cooperativeExpertSchema = new mongoose.Schema({
  company: String,
  experience: Number,
  serviceItem: [String],
  picture: String,
});

const CooperativeExpert = mongoose.model(
  "CooperativeExpert",
  cooperativeExpertSchema
);

const recommendationArticleSchema = new mongoose.Schema({
  tags: [String],
  createDT: { type: Date, default: Date.now },
  updateDT: { type: Date, default: Date.now },
  articleLink: String,
  description: String,
  articleName: String,
});

const RecommendationArticle = mongoose.model(
  "RecommendationArticle",
  recommendationArticleSchema
);
// 定义GraphQL Schema
const typeDefs = fs.readFileSync(
  path.join(__dirname, "schema.graphql"),
  "utf8"
);

// 4. 提供解析函数
const resolvers = {
  Query: {
    questions: async (parent, args) => {
      return await Question.find({
        question: { $regex: args.keyword, $options: "i" },
      });
    },
    contactForms: async () => ContactForm.find(),
    contactForm: async (_, { id }) => ContactForm.findById(id),
    cooperativeExperts: async () => CooperativeExpert.find(),
    houseSymptoms: async () => HouseSymptoms.find(),
    recommendationArticles: async () => RecommendationArticle.find(),
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
        const apiUrl =
          "https://content-language.googleapis.com/v2/documents:analyzeEntities";
        const apiKey = process.env.GOOGLE_APIKEY;

        const response = await axios.post(`${apiUrl}?key=${apiKey}`, {
          document: {
            content: text,
            type: "PLAIN_TEXT",
          },
        });

        // Extract and format relevant data from the API response
        const entities = response.data.entities.map((entity) => ({
          name: entity.name,
          type: entity.type,
          salience: entity.salience,
        }));

        return entities;
      } catch (error) {
        console.error("Error analyzing entities:", error);
        throw error;
      }
    },

    contactForms: async () => {
      try {
        const forms = await ContactForm.find();
        return forms;
      } catch (error) {
        console.error("Error fetching contact forms:", error);
        throw new Error("Failed to fetch contact forms");
      }
    },

    contactForm: async (_, { id }) => {
      try {
        const form = await ContactForm.findById(id);
        if (!form) {
          throw new Error("Contact form not found");
        }
        return form;
      } catch (error) {
        console.error("Error fetching contact form:", error);
        throw new Error("Failed to fetch contact form");
      }
    },
  },
  Mutation: {
    addQuestion: async (parent, args) => {
      const question = new Question({
        question: args.question,
        answer: args.answer,
      });
      return await question.save();
    },
    createContractForm: async (_, { input }) => {
      const newForm = new ContractForm(input);
      return newForm.save();
    },
    updateContractForm: async (_, { id, input }) => {
      return ContractForm.findByIdAndUpdate(id, input, { new: true });
    },
    deleteContractForm: async (_, { id }) => {
      return ContractForm.findByIdAndDelete(id);
    },

    createCooperativeExpert: async (_, { input }) => {
      const newExpert = new CooperativeExpert(input);
      return newExpert.save();
    },
    updateCooperativeExpert: async (_, { id, input }) => {
      return CooperativeExpert.findByIdAndUpdate(id, input, { new: true });
    },
    deleteCooperativeExpert: async (_, { id }) => {
      return CooperativeExpert.findByIdAndDelete(id);
    },

    createHouseSymptoms: async (_, { labelName }) => {
      const newSymptom = new HouseSymptoms({ labelName });
      return newSymptom.save();
    },
    updateHouseSymptoms: async (_, { id, labelName }) => {
      return HouseSymptoms.findByIdAndUpdate(id, { labelName }, { new: true });
    },
    deleteHouseSymptoms: async (_, { id }) => {
      return HouseSymptoms.findByIdAndDelete(id);
    },

    createRecommendationArticle: async (_, { input }) => {
      const newArticle = new RecommendationArticle(input);
      return newArticle.save();
    },
    updateRecommendationArticle: async (_, { id, input }) => {
      return RecommendationArticle.findByIdAndUpdate(id, input, { new: true });
    },
    deleteRecommendationArticle: async (_, { id }) => {
      return RecommendationArticle.findByIdAndDelete(id);
    },

    createTemplate: async (_, { name, content }) => {
      try {
        const template = new Template({ name, content });
        await template.save();
        return template;
      } catch (error) {
        console.error("Error creating template:", error);
        throw new Error("Failed to create template");
      }
    },
    updateTemplate: async (_, { id, name, content }) => {
      try {
        const template = await Template.findByIdAndUpdate(
          id,
          { name, content },
          { new: true }
        );
        return template;
      } catch (error) {
        console.error("Error updating template:", error);
        throw new Error("Failed to update template");
      }
    },
    deleteTemplate: async (_, { id }) => {
      try {
        const template = await Template.findByIdAndDelete(id);
        return template;
      } catch (error) {
        console.error("Error deleting template:", error);
        throw new Error("Failed to delete template");
      }
    },

    createForumPost: async (_, { title, content }) => {
      try {
        const forumPost = new ForumPost({ title, content });
        await forumPost.save();
        return forumPost;
      } catch (error) {
        console.error("Error creating forum post:", error);
        throw new Error("Failed to create forum post");
      }
    },
    updateForumPost: async (_, { id, title, content }) => {
      try {
        const forumPost = await ForumPost.findByIdAndUpdate(
          id,
          { title, content },
          { new: true }
        );
        return forumPost;
      } catch (error) {
        console.error("Error updating forum post:", error);
        throw new Error("Failed to update forum post");
      }
    },
    deleteForumPost: async (_, { id }) => {
      try {
        const forumPost = await ForumPost.findByIdAndDelete(id);
        return forumPost;
      } catch (error) {
        console.error("Error deleting forum post:", error);
        throw new Error("Failed to delete forum post");
      }
    },

    createHealthRecord: async (_, { description, date, reminder }) => {
      try {
        const healthRecord = new HealthRecord({
          description,
          date,
          reminder,
        });
        await healthRecord.save();
        return healthRecord;
      } catch (error) {
        console.error("Error creating health record:", error);
        throw new Error("Failed to create health record");
      }
    },
    updateHealthRecord: async (_, { id, description, date, reminder }) => {
      try {
        const healthRecord = await HealthRecord.findByIdAndUpdate(
          id,
          { description, date, reminder },
          { new: true }
        );
        return healthRecord;
      } catch (error) {
        console.error("Error updating health record:", error);
        throw new Error("Failed to update health record");
      }
    },
    deleteHealthRecord: async (_, { id }) => {
      try {
        const healthRecord = await HealthRecord.findByIdAndDelete(id);
        return healthRecord;
      } catch (error) {
        console.error("Error deleting health record:", error);
        throw new Error("Failed to delete health record");
      }
    },

    createExpense: async (_, { description, amount, date }) => {
      try {
        const expense = new Expense({
          description,
          amount,
          date,
        });
        await expense.save();
        return expense;
      } catch (error) {
        console.error("Error creating expense:", error);
        throw new Error("Failed to create expense");
      }
    },
    updateExpense: async (_, { id, description, amount, date }) => {
      try {
        const expense = await Expense.findByIdAndUpdate(
          id,
          { description, amount, date },
          { new: true }
        );
        return expense;
      } catch (error) {
        console.error("Error updating expense:", error);
        throw new Error("Failed to update expense");
      }
    },
    deleteExpense: async (_, { id }) => {
      try {
        const expense = await Expense.findByIdAndDelete(id);
        return expense;
      } catch (error) {
        console.error("Error deleting expense:", error);
        throw new Error("Failed to delete expense");
      }
    },

    submitContactForm: async (_, { name, email, message }) => {
      try {
        // 创建新的 ContactForm 实例
        const contactForm = new ContactForm({
          name,
          email,
          message,
        });

        // 将新创建的 ContactForm 保存到数据库
        await contactForm.save();

        // 返回 ContactForm 作为响应
        return contactForm;
      } catch (error) {
        console.error("Error submitting contact form:", error);
        throw new Error("Failed to submit contact form");
      }
    },
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
mongoose.connect(uri, {
  useUnifiedTopology: true,
});

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

// Start the Express server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
