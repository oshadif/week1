const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const querystring = require('querystring');

const PORT = 3000;
const MONGO_URI = 'mongodb+srv://chathumicf27:GoZ1AGDUDhcrqBBZ@cluster0.k6gk9.mongodb.net/'; 
const DB_NAME = 'cluster0';

async function connectDB() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(DB_NAME);
}

const server = http.createServer(async (req, res) => {
    const db = await connectDB();
    const marksCollection = db.collection('marks');

    if (req.method === 'GET' && req.url === '/') {
        // Serve the HTML form
        fs.readFile('index.html', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.method === 'POST' && req.url === '/calculate') {
        // Handle form submission
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });

        req.on('end', async () => {
            const formData = querystring.parse(body);
            const cw1 = parseFloat(formData.cw1);
            const cw2 = parseFloat(formData.cw2);

            if (isNaN(cw1) || isNaN(cw2)) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<h2>Invalid input. Please enter valid numbers.</h2>');
                return;
            }

            const moduleMark = (cw1 * 0.4) + (cw2 * 0.6);

            // Save to MongoDB
            await marksCollection.insertOne({ cw1, cw2, moduleMark });

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(<h2>Module Mark: ${moduleMark.toFixed(2)} (Saved Successfully)</h2><br><a href="/">Go Back</a>);
        });
    } else if (req.method === 'GET' && req.url === '/records') {
        // Fetch saved records
        const records = await marksCollection.find({}).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(records));
    } else {
        // Handle 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
    }
});

// Start server
server.listen(PORT, () => {
    console.log(Server running at http://localhost:${PORT});
});