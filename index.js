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
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
// const typeDefs = require("./schema/type");
// const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback", // 这里的回调 URL 需要根据你的实际情况调整
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 在这里根据 profile 查找或创建用户
        // 假设你的 UserModel 是用来存储用户信息的模型
        const user = await UserModel.findOne({ googleId: profile.id });

        if (!user) {
          // 如果用户不存在，创建新用户
          const newUser = new UserModel({
            googleId: profile.id,
            username: profile.displayName, // 假设使用 Google 的显示名称作为用户名
          });

          await newUser.save();
          done(null, newUser);
        } else {
          done(null, user);
        }
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// 序列化和反序列化用户
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  UserModel.findById(id, (err, user) => {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback'
// })
app.use(bodyParser.json());
app.use(passport.initialize());
// Google 登录路由
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google 登录回调路由
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // 登录成功后的处理，生成 JWT 并返回给前端
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    // 将 token 发送给前端，可以通过 redirect 或返回 JSON 给前端
    res.redirect(`http://localhost:3000/auth/callback/${token}`);
  }
);

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

const cardSchema = new mongoose.Schema({
  C_IDX: Number,
  C_CARD: String,
  U_IDX: Number,
  C_PW: String,
  C_FP_COUNT: Number,
  C_FP_1: String,
  C_FP_2: String,
  C_FP_3: String,
  CREATETIME: Date,
  EDITTIME: Date,
});

const historySchema = new mongoose.Schema({
  H_IDX: Number,
  H_CARD: String,
  H_DATE: Date,
  H_TIME: String,
  H_DATETIME: Date,
  H_STATE: String,
  H_RECVDATETIME: Date,
  H_SUBREADER: String,
  H_SUBREADERNO: String,
  R_IDX: Number,
  H_READERMODEL: String,
});

const readerSchema = new mongoose.Schema({
  R_IDX: Number,
  R_NO: String,
  R_NAME: String,
  R_MODEL: String,
  R_INTERFACE: String,
  R_TIMEOUT: Number,
  R_PARAMETER: String,
  R_HOLIDAY: String,
  R_HOLIDAYCTRL: String,
  R_TIMEZONE: String,
  R_TIMEFRAME: String,
  R_TIMEZONEGROUP: String,
  R_BELL: String,
  R_LIGHT: String,
  R_LIGHT_NAME: String,
  R_MAP_IDX: Number,
  R_MAP_X: Number,
  R_MAP_Y: Number,
  // Add other map indices as necessary
  SUBNAME_1: String,
  SUBNAME_2: String,
  SUBNAME_3: String,
  SUBNAME_4: String,
  SUBNAME_5: String,
  SUBNAME_6: String,
  SUBNAME_7: String,
  SUBNAME_8: String,
  POLLING: String,
  CREATETIME: Date,
  EDITTIME: Date,
});

const depSchema = new mongoose.Schema({
  D_DEPNO: Number,
  D_NAME: String,
  D_NOTE: String,
});

const permitSchema = new mongoose.Schema({
  P_IDX: Number,
  G_IDX: Number,
  R_IDX: Number,
  P_TIMEZONEIDX: Number,
  P_TIMEZONEGROUPIDX: Number,
  P_READPOINT: String,
  CREATETIME: Date,
  EDITTIME: Date,
});
const userssSchema = new mongoose.Schema({
  U_IDX: Number,
  U_NAME: String,
  U_DEPNO: Number,
  U_WORKTIMEIDX: Number,
  U_GROUPIDX: Number,
  WORKNO: String,
  IDCARD: String,
  CELLPHONE: String,
  HOMEPHONE: String,
  EMAIL: String,
  // NOTE: String,
  RESIDENCE: String,
  ADDRESS: String,
  PHOTO_FILE: String,
});

const worktimeSchema = new mongoose.Schema({
  W_IDX: Number,
  W_NAME: String,
  W_ONDUTY_1: String,
  W_OFFDUTY_1: String,
  W_ONDUTY_2: String,
  W_OFFDUTY_2: String,
  W_OT_ONDUTY: String,
  W_OT_OFFDUTY: String,
  W_FLEXIBLE_TIME: String,
  FLEXIBLE: Boolean,
  CREATETIME: Date,
  EDITTIME: Date,
});

const uacSchema = new mongoose.Schema({
  U_IDX: Number,
  U_ID: String,
  U_PASSWORD: String,
  U_ACCESS: String,
  U_CREATE: Date,
  U_FIX: Date,
});

const attendSchema = new mongoose.Schema({
  AT_NO: Number,
  AT_USERNO: Number,
  AT_DATE: Date,
  AT_CARD: String,
  AT_STATE: String,
  AT_NOTE: String,
  AT_INITIAL: String,
  AT_FIX_TIME: Date,
  AT_FIX_USER: String,
  AT_CREATE_TIME: Date,
});

const Card = mongoose.model("Card", cardSchema);
const History = mongoose.model("History", historySchema);
const Reader = mongoose.model("Reader", readerSchema);
const Dep = mongoose.model("Dep", depSchema);
const Permit = mongoose.model("Permit", permitSchema);
const Worktime = mongoose.model("Worktime", worktimeSchema);
const Users = mongoose.model("User", userssSchema);
const Uac = mongoose.model("Uac", uacSchema);
const Attend = mongoose.model("Attend", attendSchema);
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
        return Users.find();
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

    cards: () => Card.find(),
    card: (_, { C_IDX }) => Card.findById(C_IDX),
    histories: () => History.find(),
    history: (_, { H_IDX }) => History.findById(H_IDX),
    readers: () => Reader.find(),
    reader: (_, { R_IDX }) => Reader.findById(R_IDX),
    deps: () => Dep.find(),
    dep: (_, { D_DEPNO }) => Dep.findById(D_DEPNO),
    permits: () => Permit.find(),
    permit: (_, { P_IDX }) => Permit.findById(P_IDX),
    worktimes: () => Worktime.find(),
    worktime: (_, { W_IDX }) => Worktime.findById(W_IDX),
    users: () => Users.find(),
    user: (_, { U_IDX }) => User.findById(U_IDX),
    uacs: () => Uac.find(),
    uac: (_, { U_IDX }) => Uac.findById(U_IDX),
    attends: () => Attend.find(),
    attend: (_, { AT_NO }) => Attend.findById(AT_NO),
  },
  Mutation: {
    // loginWithGoogle: (_, { token }) => {
    //   // passport.authenticate("google", { scope: ["profile", "email"] });
    //   // passport.authenticate("google", { failureRedirect: "/login" }),
    //   //   (req, res) => {
    //   //     // 登录成功后的处理，生成 JWT 并返回给前端
    //   //     const token = req.user; // 在 Passport 回调中已经将 URL 返回给前端
    //   //     res.redirect(token); // 重定向到前端指定的 URL
    //   //   };

    //   return new Promise((resolve, reject) => {
    //     passport.authenticate(
    //       "google",
    //       { scope: ["profile", "email"] },
    //       (err, user) => {
    //         if (err) {
    //           reject(
    //             new AuthenticationError("Failed to authenticate with Google")
    //           );
    //         }
    //         req.login(user, { session: false }, (err) => {
    //           if (err) {
    //             reject(err);
    //           }
    //           const jwtToken = jwt.sign(
    //             { id: user._id },
    //             process.env.JWT_SECRET,
    //             {
    //               expiresIn: "1d",
    //             }
    //           );
    //           resolve({ token: jwtToken });
    //         });
    //       }
    //     )(req, res);
    //   });

    //   // try {
    //   //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   //   const jwtToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
    //   //     expiresIn: "1d",
    //   //   });
    //   //   return { token: jwtToken };
    //   // } catch (error) {
    //   //   console.error("Error with Google login:", error);
    //   //   throw new Error("Failed to login with Google");
    //   // }
    // },

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
    createCard: (
      _,
      { C_CARD, U_IDX, C_PW, C_FP_COUNT, C_FP_1, C_FP_2, C_FP_3 }
    ) => {
      const newCard = new Card({
        C_CARD,
        U_IDX,
        C_PW,
        C_FP_COUNT,
        C_FP_1,
        C_FP_2,
        C_FP_3,
      });
      return newCard.save();
    },
    updateCard: (
      _,
      { C_IDX, C_CARD, U_IDX, C_PW, C_FP_COUNT, C_FP_1, C_FP_2, C_FP_3 }
    ) => {
      return Card.findByIdAndUpdate(
        C_IDX,
        { C_CARD, U_IDX, C_PW, C_FP_COUNT, C_FP_1, C_FP_2, C_FP_3 },
        { new: true }
      );
    },
    deleteCard: (_, { C_IDX }) => {
      return Card.findByIdAndDelete(C_IDX);
    },
    createHistory: (
      _,
      {
        H_CARD,
        H_DATE,
        H_TIME,
        H_DATETIME,
        H_STATE,
        H_RECVDATETIME,
        H_SUBREADER,
        H_SUBREADERNO,
        R_IDX,
        H_READERMODEL,
      }
    ) => {
      const newHistory = new History({
        H_CARD,
        H_DATE,
        H_TIME,
        H_DATETIME,
        H_STATE,
        H_RECVDATETIME,
        H_SUBREADER,
        H_SUBREADERNO,
        R_IDX,
        H_READERMODEL,
      });
      return newHistory.save();
    },
    updateHistory: (
      _,
      {
        H_IDX,
        H_CARD,
        H_DATE,
        H_TIME,
        H_DATETIME,
        H_STATE,
        H_RECVDATETIME,
        H_SUBREADER,
        H_SUBREADERNO,
        R_IDX,
        H_READERMODEL,
      }
    ) => {
      return History.findByIdAndUpdate(
        H_IDX,
        {
          H_CARD,
          H_DATE,
          H_TIME,
          H_DATETIME,
          H_STATE,
          H_RECVDATETIME,
          H_SUBREADER,
          H_SUBREADERNO,
          R_IDX,
          H_READERMODEL,
        },
        { new: true }
      );
    },
    deleteHistory: (_, { H_IDX }) => {
      return History.findByIdAndDelete(H_IDX);
    },
    createReader: (
      _,
      {
        R_NO,
        R_NAME,
        R_MODEL,
        R_INTERFACE,
        R_TIMEOUT,
        R_PARAMETER,
        R_HOLIDAY,
        R_HOLIDAYCTRL,
        R_TIMEZONE,
        R_TIMEFRAME,
        R_TIMEZONEGROUP,
        R_BELL,
        R_LIGHT,
        R_LIGHT_NAME,
        R_MAP_IDX,
        R_MAP_X,
        R_MAP_Y,
        SUBNAME_1,
        SUBNAME_2,
        SUBNAME_3,
        SUBNAME_4,
        SUBNAME_5,
        SUBNAME_6,
        SUBNAME_7,
        SUBNAME_8,
        POLLING,
      }
    ) => {
      const newReader = new Reader({
        R_NO,
        R_NAME,
        R_MODEL,
        R_INTERFACE,
        R_TIMEOUT,
        R_PARAMETER,
        R_HOLIDAY,
        R_HOLIDAYCTRL,
        R_TIMEZONE,
        R_TIMEFRAME,
        R_TIMEZONEGROUP,
        R_BELL,
        R_LIGHT,
        R_LIGHT_NAME,
        R_MAP_IDX,
        R_MAP_X,
        R_MAP_Y,
        SUBNAME_1,
        SUBNAME_2,
        SUBNAME_3,
        SUBNAME_4,
        SUBNAME_5,
        SUBNAME_6,
        SUBNAME_7,
        SUBNAME_8,
        POLLING,
      });
      return newReader.save();
    },
    updateReader: (
      _,
      {
        R_IDX,
        R_NO,
        R_NAME,
        R_MODEL,
        R_INTERFACE,
        R_TIMEOUT,
        R_PARAMETER,
        R_HOLIDAY,
        R_HOLIDAYCTRL,
        R_TIMEZONE,
        R_TIMEFRAME,
        R_TIMEZONEGROUP,
        R_BELL,
        R_LIGHT,
        R_LIGHT_NAME,
        R_MAP_IDX,
        R_MAP_X,
        R_MAP_Y,
        SUBNAME_1,
        SUBNAME_2,
        SUBNAME_3,
        SUBNAME_4,
        SUBNAME_5,
        SUBNAME_6,
        SUBNAME_7,
        SUBNAME_8,
        POLLING,
      }
    ) => {
      return Reader.findByIdAndUpdate(
        R_IDX,
        {
          R_NO,
          R_NAME,
          R_MODEL,
          R_INTERFACE,
          R_TIMEOUT,
          R_PARAMETER,
          R_HOLIDAY,
          R_HOLIDAYCTRL,
          R_TIMEZONE,
          R_TIMEFRAME,
          R_TIMEZONEGROUP,
          R_BELL,
          R_LIGHT,
          R_LIGHT_NAME,
          R_MAP_IDX,
          R_MAP_X,
          R_MAP_Y,
          SUBNAME_1,
          SUBNAME_2,
          SUBNAME_3,
          SUBNAME_4,
          SUBNAME_5,
          SUBNAME_6,
          SUBNAME_7,
          SUBNAME_8,
          POLLING,
        },
        { new: true }
      );
    },
    deleteReader: (_, { R_IDX }) => {
      return Reader.findByIdAndDelete(R_IDX);
    },
    createDep: (_, { D_DEPNO, D_NAME, D_NOTE }) => {
      const newDep = new Dep({ D_DEPNO, D_NAME, D_NOTE });
      return newDep.save();
    },
    updateDep: (_, { D_DEPNO, D_NAME, D_NOTE }) => {
      return Dep.findByIdAndUpdate(D_DEPNO, { D_NAME, D_NOTE }, { new: true });
    },
    deleteDep: (_, { D_DEPNO }) => {
      return Dep.findByIdAndDelete(D_DEPNO);
    },
    createPermit: (
      _,
      { G_IDX, R_IDX, P_TIMEZONEIDX, P_TIMEZONEGROUPIDX, P_READPOINT }
    ) => {
      const newPermit = new Permit({
        G_IDX,
        R_IDX,
        P_TIMEZONEIDX,
        P_TIMEZONEGROUPIDX,
        P_READPOINT,
      });
      return newPermit.save();
    },
    updatePermit: (
      _,
      { P_IDX, G_IDX, R_IDX, P_TIMEZONEIDX, P_TIMEZONEGROUPIDX, P_READPOINT }
    ) => {
      return Permit.findByIdAndUpdate(
        P_IDX,
        { G_IDX, R_IDX, P_TIMEZONEIDX, P_TIMEZONEGROUPIDX, P_READPOINT },
        { new: true }
      );
    },
    deletePermit: (_, { P_IDX }) => {
      return Permit.findByIdAndDelete(P_IDX);
    },
    createWorktime: (
      _,
      {
        W_NAME,
        W_ONDUTY_1,
        W_OFFDUTY_1,
        W_ONDUTY_2,
        W_OFFDUTY_2,
        W_OT_ONDUTY,
        W_OT_OFFDUTY,
        W_FLEXIBLE_TIME,
        FLEXIBLE,
      }
    ) => {
      const newWorktime = new Worktime({
        W_NAME,
        W_ONDUTY_1,
        W_OFFDUTY_1,
        W_ONDUTY_2,
        W_OFFDUTY_2,
        W_OT_ONDUTY,
        W_OT_OFFDUTY,
        W_FLEXIBLE_TIME,
        FLEXIBLE,
      });
      return newWorktime.save();
    },
    updateWorktime: (
      _,
      {
        W_IDX,
        W_NAME,
        W_ONDUTY_1,
        W_OFFDUTY_1,
        W_ONDUTY_2,
        W_OFFDUTY_2,
        W_OT_ONDUTY,
        W_OT_OFFDUTY,
        W_FLEXIBLE_TIME,
        FLEXIBLE,
      }
    ) => {
      return Worktime.findByIdAndUpdate(
        W_IDX,
        {
          W_NAME,
          W_ONDUTY_1,
          W_OFFDUTY_1,
          W_ONDUTY_2,
          W_OFFDUTY_2,
          W_OT_ONDUTY,
          W_OT_OFFDUTY,
          W_FLEXIBLE_TIME,
          FLEXIBLE,
        },
        { new: true }
      );
    },
    deleteWorktime: (_, { W_IDX }) => {
      return Worktime.findByIdAndDelete(W_IDX);
    },
    createUser: (
      _,
      {
        U_NAME,
        U_DEPNO,
        U_WORKTIMEIDX,
        U_GROUPIDX,
        WORKNO,
        IDCARD,
        CELLPHONE,
        HOMEPHONE,
        EMAIL,
        NOTE,
        RESIDENCE,
        ADDRESS,
        PHOTO_FILE,
      }
    ) => {
      const newUser = new Users({
        U_NAME,
        U_DEPNO,
        U_WORKTIMEIDX,
        U_GROUPIDX,
        WORKNO,
        IDCARD,
        CELLPHONE,
        HOMEPHONE,
        EMAIL,
        NOTE,
        RESIDENCE,
        ADDRESS,
        PHOTO_FILE,
      });
      return newUser.save();
    },
    updateUser: (
      _,
      {
        U_IDX,
        U_NAME,
        U_DEPNO,
        U_WORKTIMEIDX,
        U_GROUPIDX,
        WORKNO,
        IDCARD,
        CELLPHONE,
        HOMEPHONE,
        EMAIL,
        NOTE,
        RESIDENCE,
        ADDRESS,
        PHOTO_FILE,
      }
    ) => {
      return Users.findByIdAndUpdate(
        U_IDX,
        {
          U_NAME,
          U_DEPNO,
          U_WORKTIMEIDX,
          U_GROUPIDX,
          WORKNO,
          IDCARD,
          CELLPHONE,
          HOMEPHONE,
          EMAIL,
          NOTE,
          RESIDENCE,
          ADDRESS,
          PHOTO_FILE,
        },
        { new: true }
      );
    },
    deleteUser: (_, { U_IDX }) => {
      return Users.findByIdAndDelete(U_IDX);
    },
    createUac: (_, { U_ID, U_PASSWORD, U_ACCESS }) => {
      const newUac = new Uac({ U_ID, U_PASSWORD, U_ACCESS });
      return newUac.save();
    },
    updateUac: (_, { U_IDX, U_ID, U_PASSWORD, U_ACCESS }) => {
      return Uac.findByIdAndUpdate(
        U_IDX,
        { U_ID, U_PASSWORD, U_ACCESS },
        { new: true }
      );
    },
    deleteUac: (_, { U_IDX }) => {
      return Uac.findByIdAndDelete(U_IDX);
    },
    createAttend: (
      _,
      {
        AT_USERNO,
        AT_DATE,
        AT_CARD,
        AT_STATE,
        AT_NOTE,
        AT_INITIAL,
        AT_FIX_TIME,
        AT_FIX_USER,
      }
    ) => {
      const newAttend = new Attend({
        AT_USERNO,
        AT_DATE,
        AT_CARD,
        AT_STATE,
        AT_NOTE,
        AT_INITIAL,
        AT_FIX_TIME,
        AT_FIX_USER,
      });
      return newAttend.save();
    },
    updateAttend: (
      _,
      {
        AT_NO,
        AT_USERNO,
        AT_DATE,
        AT_CARD,
        AT_STATE,
        AT_NOTE,
        AT_INITIAL,
        AT_FIX_TIME,
        AT_FIX_USER,
      }
    ) => {
      return Attend.findByIdAndUpdate(
        AT_NO,
        {
          AT_USERNO,
          AT_DATE,
          AT_CARD,
          AT_STATE,
          AT_NOTE,
          AT_INITIAL,
          AT_FIX_TIME,
          AT_FIX_USER,
        },
        { new: true }
      );
    },
    deleteAttend: (_, { AT_NO }) => {
      return Attend.findByIdAndDelete(AT_NO);
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
