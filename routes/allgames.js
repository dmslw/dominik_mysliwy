var express = require('express');
var router = express.Router();
const ObjectId = require('mongodb').ObjectId;

/* GET team */
router.get('/allgame/', async function(req, res, next) {
    const id = req.query.id;
    let allgame;
    if (id) {
        allgame = await req.db.db('myapp')
            .collection('allgames')
            .findOne(ObjectId(id));
    } else {
        allgame = {
            gameName: "",
        }
    }
    res.render('allgame', { title: 'Edytuj grę', allgame: allgame });
});

/* POST team */
router.post('/allgame/', async function (req, res, next) {
    try {
        let allgame = {
            _id: req.body._id ? ObjectId(req.body._id) : undefined,
            gameName: req.body.game_name,
        };
        if (allgame._id) {
            await req.db.db('myapp').collection("allgames").replaceOne({_id: allgame._id}, allgame);
        } else {
            await req.db.db('myapp').collection("allgames").insertOne(allgame);
        }
        res.redirect('/allgames/');
    } catch (err) {
        console.error(err);
    }
    //next();
});

/* DELETE team */
router.get('/allgame-delete/', async function (req, res, next) {
    try {
        let id = req.query.id;
        await req.db.db('myapp').collection("allgames").findOneAndDelete({_id: ObjectId(id)});
        res.redirect('/allgames/');
    } catch (err) {
        console.error(err);
    }
    //next();
});

/* GET teams. */
router.get('/', async function(req, res, next) {
    const pageSize = 10;
    let sort = parseInt(req.query.sort);
    sort = sort ? sort : 1;
    const search = req.query.search ?
        // usuwamy z frazy wyszukiwania wszystkie znaki specjalne dla wyrażeń regularnych
        req.query.search.replace(/[\\.?+*{}()\[\]^$]+/g, '')
        : undefined;
    // Najprostszy możliwy sposób na filtrowanie dokumentów w kolekcji
    /*let query = search ? {
        $where: `function () {
            return this.teamName.toLowerCase().indexOf('${search.toLowerCase()}') >= 0;
        }`
    } : {};*/
    // Wyszukiwanie pełnotekstowe (full-text query), wykorzystuje indeks tekstowy (patrz ./db.js)
    // oraz wyszukianie regex dla niepełnych słów
    let query = search ? {
        $or: [{
            gameName: {
                $regex: search,
                $options: 'i',
            }
        }, {
            $text: {
                $search: search,
                $language: "english",
                $caseSensitive: false,
                $diacriticSensitive: false,
            }
        }]
    } : {};
    const count = await req.db.db('myapp')
        .collection('allgames')
        .countDocuments(query);
    const maxPage = Math.floor(count / pageSize);
    let page = parseInt(req.query.page);
    page = page >= 0 ? page : 0;
    page = page <= maxPage ? page : maxPage;
    const prevPage = page > 0 ? page - 1 : 0;
    const nextPage = page < maxPage ? page + 1 : maxPage;

    const allgames = await req.db.db('myapp')
        .collection('allgames')
        .find(query)
        .collation({
            locale: 'pl'
        })
        .sort(['gameName', sort])
        .skip(page * pageSize)
        .limit(pageSize)
        .toArray();

    const reportCollection = await req.db.db('myapp')
        .collection('allgames')
        .mapReduce(/* map */ function () {
            emit('gameNameLength', this.gameName.length);
        }, /* reduce */ function (key, lengths) {
            return Array.sum(lengths);
        }, {
            out: 'inline',
            query: query,
        });

    const report = await reportCollection
        .find()
        .toArray();

    res.render('allgames', {
        title: 'allgames',
        allgames: allgames,
        search: search,
        sort: sort,
        page: page,
        prevPage: prevPage,
        nextPage: nextPage,
        count: count,
        report: report,
    });
});

module.exports = router;
