const mongoose = require("mongoose")
const fetch = require("node-fetch")

const Problems = require("../models/problemModel");

mongoose.connect('mongodb+srv://rachitsindhu242:opgdOAfzad2C12Wf@cluster0.no8slgz.mongodb.net/?retryWrites=true&w=majority').then( async () => {
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