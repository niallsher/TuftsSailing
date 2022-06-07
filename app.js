var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var path = require('path')
var express = require('express');
var app = express();
const { MongoClient } = require('mongodb');
var bodyParser = require('body-parser');


var port = process.env.PORT || 8080


const uri = "mongodb+srv://niallsheridan:ryder56nbs@cluster0.ytcqd.mongodb.net/?retryWrites=true&w=majority";


app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, '/')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

function makeSelect(position, sailors)
{
    var t= "";
    t = "<td><select name='" + position + "'><option></option>";
    for (i = 0; i < sailors.length; i++)
        t += "<option>" + sailors[i].Name + "</option>";
    t+= "</select></td>"; 
    return t;
}

function available_sailors(skippers, crews, res)
{
    res.write("<div class='rightCol'><table><tr><th>Skippers</th><th>Crews</th></tr>");
    if (skippers.length < crews.length) {
        for (let i = 0; i < crews.length; i++) {
            if (i >= skippers.length) {
                res.write("<tr><td></td><td>"+crews[i].Name+"</td></tr>")
            } else {
                res.write("<tr><td id='skip"+i+"' >"+skippers[i].Name+"</td><td>"+crews[i].Name+"</td></tr>")
            }
        }
    }
    res.write("</table></div></div>");
}


app.post("/lineup.html", async function (req, res) {

    res.writeHead(200, {'Content-Type':'text/html'});
    res.write ("<head><meta name='viewport' content='width=device-width, initial-scale=1'><link rel='stylesheet' type = 'text/css' href='stylesheet.css'><title>Tufts Sailing</title>    </head><body><header><a class = 'logoBut' href ='index.html' align ='left'> <img id = 'logo' align='left' src='burgee.png'></a><h1> &nbsp; Tufts Sailing</h1><a href = 'index.html'>Home</a><a href = 'form.html'>Form</a><a class='current' href = 'admin.html'>Admin Page</a></header><br><h2>Welcome to the admin Page</h2>");
    res.write("")

    console.log("req body: " + JSON.stringify(req.body));
    


    /***********************
     *                     *
     *                     *
     *    Print Lineup     *
     *                     *
     *                     *
     ***********************/

    const query_type = req.body.query;
    if (query_type == "Lineup") {
        var day = "";
        day = req.body.weekday;
        res.write("<h3>" + day + "\'s Lineup</h3><br/>");
    

        var w_pairings = false;
        var inc_boat_num = false;
        var separate_start = false;
        var separate_unpaired = false;
        var assigned_boats = false;
        var six_oclocks = false;
        var late_arrivals = false;
        var use_teams = false;

        for (let i = 0; i < req.body.option.length; i++) {
            // options.push(req.body.option[i]);
            switch(req.body.option[i]) {
                case "Pairings":
                    w_pairings = true;
                    break;
                case "BoatNum":
                    inc_boat_num = true;
                    break;
                case "StartTime":
                    separate_start = true;
                    break;
                case "Loners":
                    separate_unpaired = true;
                    break;
                
                case "AssignBoats":
                    assigned_boats = true;
                    break;
                case "SixOclock":
                    six_oclocks = true;
                    break;
                case "ArriveLate":
                    late_arrivals = true;
                    break;
                case "Teams":
                    use_teams = true;
                    break;
                default:
                    break;

            }
        }
        
        var theQuery = {[day]:{$ne: "-"}};
        console.log("type: " + query_type + ", day: " + day + ", query: " + JSON.stringify(theQuery));


        
        pdata = "";
        // parse1(pdata, res);

        console.log("in parse function")
        const mongo = new MongoClient(uri, {useUnifiedTopology: true });
        var result;
        try {

            await mongo.connect();

            var dbo = await mongo.db("SailingTeam");
            var collection = await dbo.collection('Sailors');
            console.log("before find");
            console.log("query: " + JSON.stringify(theQuery));
            result = await collection.find(theQuery);
            console.log("after find");
            result.toArray(function(err, sailors) {

                if (err) {
                    console.log("Error: " + err);
                } else {
    
                    console.log("here");
    
                    console.log("Sailors length: " + sailors.length);
                    console.log("Array of sailors: " + JSON.stringify(sailors));
    
    
                    var skippers = [];
                    var crews = [];
                    for (i=0; i < sailors.length; i++) {
                        console.log(i + ": " + sailors[i].Name);
                        if (sailors[i].Position == "Skipper") {
                            skippers.push(sailors[i]);
                        } else {
                            crews.push(sailors[i]);
                        }
                        // res.write("<p>" + sailors[i].Name + ",&nbsp;&nbsp; " + sailors[i].Position + ",&nbsp;&nbsp; " + sailors[i].Partner + "</p><br/>");
                    }
                    // console.log("skippers: " + JSON.stringify(skippers));
                    // console.log("crews: " + JSON.stringify(crews));
    
                
    
                    var pairings = [];
                    for (let i = 0; i < skippers.length; i++) {
                        for (let j = 0; j < crews.length; j++) {
                            // console.log("i: " + i + ", j: " + j);
                            if (skippers[i].Name == crews[j].Partner) {
                                pairings.push(skippers[i]);
                                skippers.splice(i, 1);
                                i--;
                                crews.splice(j, 1);
                                j--;
                                break;
                            }
                        }
                    }
    
                    // console.log("\nskippers: " + JSON.stringify(skippers));
                    // console.log("\ncrews: " + JSON.stringify(crews));
                    // console.log("\npairings: " + JSON.stringify(pairings));
                    // console.log("total length: " + (skippers.length + crews.length + pairings.length));
    
                    if (inc_boat_num) {
                        if (w_pairings) {
                            res.write("<br/><div id='tableCols'><div class='leftCol'><table id='lineup_table'><tr><th>Boat Number</th><th>Skipper</th><th>Crew</th></tr>");
                        
                            for (let i = 0; i < 24; i++) {
                                if (i < pairings.length) {
                                    // console.log("making set pairings, i: " + i);
                                    res.write("<tr><td>"+(i+1)+"</td><td>"+pairings[i].Name+"</td><td>"+pairings[i].Partner+"</td></tr>");
                                } else {
                                    res.write("<tr><td>"+(i+1)+"</td>");
                                    res.write(makeSelect("skippers", skippers) + makeSelect("crews", crews) + "</tr>")
                                }
    
                            }
                            res.write("</table></div>")
                            available_sailors(skippers, crews, res);
    
                            // res.write("</table></div><div class='rightCol'><table><tr><th>Skippers</th><th>Crews</th></tr>");
                            // if (skippers.length < crews.length) {
                            //     for (let i = 0; i < crews.length; i++) {
                            //         if (i >= skippers.length) {
                            //             res.write("<tr><td></td><td>"+crews[i].Name+"</td></tr>")
                            //         } else {
                            //             res.write("<tr><td>"+skippers[i].Name+"</td><td>"+crews[i].Name+"</td></tr>")
                            //         }
                            //     }
                            // }
                            // res.write("</table></div></div>");
                        }
                    }
    
    
    
                }
            });

            
            
            
        } catch(err) {
                console.log("in catch:" + err);
            
        } finally {
            // console.log("close");
            // await mongo.close();
            
        }


        console.log("DO YOU SEE THIS RESULT: " + result);
        
    } 

    /***********************
     *                     *
     *                     *
     *    Print Roster     *
     *                     *
     *                     *
     ***********************/

    else {
        res.write("<h3>Team Roster</h3><br/>");
        const mongo = new MongoClient(uri, {useUnifiedTopology: true });
        try {

            await mongo.connect();

            var dbo = await mongo.db("SailingTeam");
            var collection = await dbo.collection('Sailors');


            result = await collection.find({});
            
            result.toArray(function(err, sailors) {

                if (err) {
                    console.log("Error: " + err);
                } else {

                    console.log("here");

                    console.log("Sailors length: " + sailors.length);
                    console.log("Array of sailors: " + JSON.stringify(sailors));

                    res.write("<br/><table id='lineup_table'><tr><th>Number</th><th>Name</th><th>Position</th><th>Year</th><th>Tues</th><th>Wed</th><th>Thurs</th><th>Fri</th></tr>");

                    for (i=0; i < sailors.length; i++) {
                        res.write("<tr><td>"+(i+1)+"</td><td>"+sailors[i].Name+"</td><td>"+sailors[i].Position+"</td><td>"+sailors[i].Year+"</td><td>"+sailors[i].Tuesday+"</td><td>"+sailors[i].Wednesday+"</td><td>"+sailors[i].Thursday+"</td><td>"+sailors[i].Friday+"</td></tr>");
                        
                        // res.write("<p>" + sailors[i].Name + ",&nbsp;&nbsp; " + sailors[i].Position + ",&nbsp;&nbsp; " + sailors[i].Partner + "</p><br/>");
                    }
                    res.write("</table>");

                }
            });
        } catch(err) {
                console.log("in catch:" + err);
            
        } finally {
            // console.log("close");
            // await mongo.close();
            // res.send();
        }
    }

    

});

app.post('/admin', async function (req, res) {

    res.sendFile(path.join(__dirname, '/admin.html')); 

})

app.post('/schedule.html', function(req, res) {
    var username = req.body.user;
    console.log(username)

    res.sendFile(path.join(__dirname, '/schedule.html')); 
});



/******************************************************* 
 *                                                     *
 * Adding Sailor Documents to Database using form.html *
 *                                                     *
 *******************************************************/
app.post("/process", async function (req, res) {

    console.log("req.body: " + JSON.stringify(req.body));


    console.log("the uri is: " + uri);
    const mongo = new MongoClient(uri, {useUnifiedTopology: true });

    try {
        console.log("In try");
        console.log("before connect");
        await mongo.connect();
    
        console.log("before database");
    
        const database = mongo.db('SailingTeam');
        console.log("before collection");
    
        const collection = database.collection('Sailors');
    
        console.log("before query");

        delete req.body._id; // for safety reasons
        const theQuery = req.body;

        console.log("before insert");
        
        await collection.deleteOne({'Name':req.body.Name});

        await collection.insertOne(theQuery);
        console.log("end try");
    } catch(err) {
        console.log("in catch:" + err);
    }
    finally {
        console.log("finally");

        // Ensures that the client will close when you finish/error
        await mongo.close();
    }

    res.sendFile(path.join(__dirname, '/form.html'));


});


app.listen(port, () => console.log("Server is running..."));
