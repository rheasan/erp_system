const correct_data = {
    name: "aad",
    desc: "adad",
    id: "MD_0001",
    jobs: [
        {
            name: "job1",
            commands: [
                "command1",
                "command2",
            ],
        }
    ]
};
const incorrect_data = {
    name: "aad",
    desc: 12,
    id: "MD_0001",
    jobs: [
        {
            name: "job1",
            commands: [
                "command1",
                "command2",
            ],
        }
    ]
};

async function test_correct(){
    console.log("test correct process obj");
    await fetch("http://127.0.0.1:8000/create_process", {
        method: "POST",
        headers: {
            "Accept" : "*",
            "Content-Type" : "application/json"
        },
        body: JSON.stringify(correct_data),
    }).then((res) => {
        if(res.status === 200){
            console.log("correct data was accepted OK");
        }
        else{
            console.log("something went wrong");
        }
        return res.json();
    })
    .then((res) => {
        console.log("message = " + res);
    })
    .finally((_) => {
        console.log("finished\n");
    });
}

async function test_incorrect(){
    console.log("test incorrect process obj");
    await fetch("http://127.0.0.1:8000/create_process", {
        method: "POST",
        headers: {
            "Accept" : "*",
            "Content-Type" : "application/json"
        },
        body: JSON.stringify(incorrect_data),
    }).then((res) => {
        if(res.status === 400){
            console.log("incorrect data was rejected OK");
        }
        else{
            console.log("something went wrong");
        }
        return res.json();
    })
    .then((res) => {
        console.log("message = " + res);
    })
    .finally((_) => {
        console.log("finished\n");
    });
}
(async () => {
    await test_correct();
    await test_incorrect();
})();