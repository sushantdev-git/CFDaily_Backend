const mongoose = require("mongoose")
const fetch = require("node-fetch")
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const Problems = require("../models/problemModel");

const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASE_PASSWORD
  );

mongoose.connect(DB).then( async () => {
    console.log("Database successfully connected");
    const response = await fetch('https://codeforces.com/api/problemset.problems');
    const responseJSON = await response.json();
    const problems = responseJSON.result.problems.map((el)=> {
        return {
            name:el.name,
            rating:el.rating,
            link: `https://codeforces.com/problemset/problem/${el.contestId}/${el.index}`
        }
    });

    Problems.insertMany(problems);
    console.log("Problems successfully inserted");
})