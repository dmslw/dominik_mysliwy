var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost";

module.exports = {
    client: new MongoClient(url, { useUnifiedTopology: true }),
    async connect() {
        try {
            await this.client.connect();
            // Indeks do wyszukiwania pełnotekstowego po polu `teamName`
            await this.client.db('myapp').collection('allgames').createIndex({
                gameName: "text"
            }, {
                default_language: "english",
            });
            // Indeks do wyszukiwania z wyrażeniem regularnym po polu `teamName`
            // (dla wyszukiwania po niepełnych słowach)
            await this.client.db('myapp').collection('allgames').createIndex({
                gameName: 1

            });





        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}
