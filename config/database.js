var mysql = require('mysql');

module.exports = function() {
    return {
        init: function() {
            return mysql.createConnection(this.info());
        },

        info: function() {
            return {
                host: 'localhost',
                port: '3306',
                user: 'root',
                password: 'password',
                database: 'eartheye_db'
            }
        },

        open: function(con) {
            con.connect(function(err) {
                if(err) {
                    console.log('mysql connection error : '+ err);
                } else {
                    console.log('mysql is connected successfully.');
                }
            });
        },

        error: function(err, res) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    };
};