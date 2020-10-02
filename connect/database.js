var mysql = require('mysql')
var util = require('util')

var pool = mysql.createPool({
    connectionLimit: 10,
    host     : 'localhost',
    user     : 'insight',
    password : 'cat15000',
    database : 'testAPI'
})

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            strerr='Database connection was closed.'
            console.error('Database connection was closed.')
          }
          if (err.code === 'ER_CON_COUNT_ERROR') {
            strerr='Database has too many connections.';
            console.error('Database has too many connections.')
          }
          if (err.code === 'ECONNREFUSED') {
            strerr='Database connection was refused.';
            console.error('Database connection was refused.')
          }
    }

    if (connection) connection.release()

    return
})

pool.query = util.promisify(pool.query)

module.exports = pool
