
const { MongoClient } = require('mongodb');

const url = "mongodb+srv://niallsheridan:ryder56nbs@cluster0.ytcqd.mongodb.net/SailingTeam?retryWrites=true&w=majority";

const mongo = new MongoClient(url, {useUnifiedTopology: true });


async function main()
{

	await mongo.connect();

	var data = await mongo.db("SailingTeam");
	var collection = await data.collection("Sailors");

	var theQuery2 = {Name: /^/ };
	await collection.deleteMany(theQuery2);

	mongo.close();

}


main();

