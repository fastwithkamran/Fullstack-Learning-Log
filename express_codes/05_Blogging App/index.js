const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication");

const Blog = require("./models/blog");

const userRoute = require("./routers/user");
const blogRoute = require("./routers/blog");

const app = express();
const PORT = 8000;

mongoose
  .connect("mongodb://localhost:27017/blogify")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("MongoDB error", err);
  });

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.use(express.static(path.resolve("./public")));

app.get("/", async (req, res) => {
  const allblogs = await Blog.find({});

  res.render("home", {
    user: req.user,
    blogs: allblogs,
  });
});

app.listen(PORT, () => console.log("Server Started"));
