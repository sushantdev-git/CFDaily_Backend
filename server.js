const mongoose = require("mongoose");
const dotenv = require("dotenv");

const cluster = require('cluster');
const os = require('os')

const numCpus = os.cpus().length;

const app = require("./app");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

const startListening = () => {
  const port = process.env.PORT || 8000;
  if(cluster.isMaster){
    for(let i=0; i<Math.max(numCpus, 4); i++){
      cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker with ${worker.process.pid} died`);
      cluster.fork(); //if any worker dies we are forking a new worker
    })
  }
  else{
    app.listen(port, () => {
      console.log(`server ${process.pid} running on port ${port} . . .`);
    });
  }
}

mongoose.connect(DB).then(() => {
  // console.log("Database connected successfully");
  startListening()
});
