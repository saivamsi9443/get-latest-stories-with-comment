const http = require('http');
const https=require('https')

// Function to fetch HTML content from Time.com
function getHTML(url, callback) {
    
    // Determine the protocol
    const protocol = url.startsWith('https') ? https : http;

    // Parse the URL
    const urlParts = new URL(url);
    
    // Prepare options for the request
    const options = {
        hostname: urlParts.hostname,
        path: urlParts.pathname + urlParts.search,
        method: 'GET'
    };

    // Make the request
    const req = protocol.request(options, (res) => {
        // Check if it's a redirect
        if (res.statusCode === 301 || res.statusCode === 302) {
            // Get the new location from the 'location' header
            const newUrl = res.headers.location;
            console.log("Redirected to:", newUrl);
            // Fetch HTML content from the new location
            getHTML(newUrl, callback);
            return;
        }

        let data = '';

        // A chunk of data has been received
        res.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received
        res.on('end', () => {
            callback(data);
        });
    });

    req.on("error", (err) => {
        console.log("Error: ", err.message);
    });

    // End the request
    req.end();
}

// Function to extract the latest stories from HTML content
// Function to extract the latest stories from HTML content
function extractLatestStories(html) {
    let latestStories = [];
    try {
        // Extracting the latest stories from HTML content
        let startMarker = '<div class="partial latest-stories"';
        let endMarker = '</ul>';
        let startIndex = html.indexOf(startMarker);
        let endIndex = html.indexOf(endMarker, startIndex);
        let storiesHtml = html.substring(startIndex, endIndex);

        // Extracting individual story details
        let itemPattern = /<li class="latest-stories__item">([\s\S]*?)<\/li>/g;
        let match;
        while ((match = itemPattern.exec(storiesHtml)) !== null) {
            let itemHtml = match[1];
            let titleStart = itemHtml.indexOf('<h3 class="latest-stories__item-headline">');
            if (titleStart === -1) continue;
            titleStart += '<h3 class="latest-stories__item-headline">'.length;
            let titleEnd = itemHtml.indexOf('</h3>', titleStart);
            let title = itemHtml.substring(titleStart, titleEnd);

            let linkStart = itemHtml.indexOf('<a href="') + '<a href="'.length;
            let linkEnd = itemHtml.indexOf('">', linkStart);
            let link = "https://time.com" + itemHtml.substring(linkStart, linkEnd);

            latestStories.push({ "title": title.trim(), "link": link.trim() });
        }
    } catch (error) {
        console.log("Error:", error.message);
    }
    return latestStories.slice(0, 6); // Return only the latest 6 stories
}


// Creating a simple HTTP server to handle requests
const server = http.createServer((req, res) => {
    if (req.url === '/getTimeStories' && req.method === 'GET') {
        const url = 'http://time.com';
        getHTML(url, (html) => {
            const latestStories = extractLatestStories(html); 
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(latestStories, null, 2));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found......');
    }
});

// Starting the server in port : 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});