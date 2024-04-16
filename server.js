// import modules
const http = require('http'),
    fs = require('fs'),
    url = require('url');

// uses createServer function from HTTP
http.createServer((request, response) => {
    
    // creates variables based on the URL request
    let addr = request.url,
        q = new URL(addr, 'http://localhost:8080'),
        filePath = '';

    // logs URL to log.txt file
    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added to log.');
        }
    });

    // if the URL includes the word, create a path to the file
    if (q.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    } else {
        filePath = 'index.html';
    }

    // takes new file path and grabs corresponding file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            throw err;
        }

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(data);
        response.end();
    });

// listens for a response on port 8080
}).listen(8080);

console.log('My test server is running on Port 8080.');