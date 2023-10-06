import express from "express";
import z from "zod";
import {z_new_process, z_process} from "./processes";
import save_process from "./save_process";

const app = express();
app.use(express.json());
const PORT = 8000;

app.get("/", (req, res)=> {
    res.status(200).send("homepage");
});


app.get("/hello", (req, res) => {
    res.status(200).send("hello from server");
});

app.post("/create_process", async (req, res) => {
    // console.log(`request from ${req.ip}`);
    // console.log(req.body);
    const body = z_new_process.safeParse(req.body);

    if(!body.success){
        res.status(400).json("failed to parse");
        return;
    }

    const result = await save_process(body.data);
    if(!result.success) {
        res.status(400).json("failed to parse: " + result.error);
        return;
    }
    res.status(200).json("new process added");
    console.log(body.data);
});


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});