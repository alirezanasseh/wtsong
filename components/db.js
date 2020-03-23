const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const database = "wtsdb";

module.exports = class DB {
    
    insertOne(props, next){
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if (err){
                next(err);
            }else{
                let dbo = db.db(database);
                dbo.collection(props.collection).insertOne(props.data, (err, res) => {
                    if (err){
                        next(err);
                    }else{
                        next(null, res);
                        db.close();
                    }
                });
            }
        });
    }

    getOne(props, next){
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if (err){
                next(err);
            }else{
                let dbo = db.db(database);
                let fields = {};
                if(props.params && props.params.fields){
                    for(let i = 0; i < props.params.fields.length; i++){
                        fields[props.params.fields[i]] = 1;
                    }
                }
                dbo.collection(props.collection).findOne(props.query, function(err, result) {
                    if (err){
                        next(err);
                    }else{
                        next(null, result);
                        db.close();
                    }
                });
            }
        });
    }

    getMany(props, next){
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if (err){
                next(err);
            }else{
                let dbo = db.db(database);
                if(!props.limit){
                    props.limit = 0;
                }
                let fields = {};
                if(props.params && props.params.fields){
                    for(let i = 0; i < props.params.fields.length; i++){
                        fields[props.params.fields[i]] = 1;
                    }
                }
                dbo.collection(props.collection).find(props.query, fields).sort(props.sort).limit(props.limit).toArray((err, result) => {
                    if(err){
                        next(err);
                    }else{
                        next(null, result);
                        db.close();
                    }
                });
            }
        });
    }

    updateOne(props, next){
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if(err){
                next(err);
            }else{
                let dbo = db.db(database);
                let values = {};
                if(props.inc){
                    values = {$inc: props.inc};
                }else {
                    values = {$set: props.values};
                }
                dbo.collection(props.collection).updateOne(props.query, values, (err, res) => {
                    if(err){
                        next(err);
                    }else{
                        next(null, res);
                        db.close();
                    }
                });
            }
        });
    }

    deleteOne(props, next){
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if(err){
                next(err);
            }else{
                let dbo = db.db(database);
                dbo.collection(props.collection).deleteOne(props.query, (err, obj) => {
                    if(err){
                        next(err);
                    }else{
                        next(null, {status: 'true'});
                        db.close();
                    }
                });
            }
        });
    }

    deleteMany(props, next){
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if(err){
                next(err);
            }else{
                let dbo = db.db(database);
                dbo.collection(props.collection).deleteMany(props.query, (err, obj) => {
                    if(err){
                        next(err);
                    }else{
                        next(null, {status: 'true'});
                        db.close();
                    }
                });
            }
        });
    }
};