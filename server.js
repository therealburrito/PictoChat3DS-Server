/**
 * PictoChat3DS Server
 * * Host for FREE on Render, Railway, or Fly.io as a standard Web Service / TCP service.
 * Relays coordinates and messages across linked 3DS console network nodes.
 */

const net = require('net');

const PORT = process.env.PORT || 3000;
let clients = [];

const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[+] Console connected: ${clientAddress}`);
    
    clients.push(socket);

    // Keepalive Ping configuration
    const pingInterval = setInterval(() => {
        if (socket.writable) {
            socket.write('PING\n');
        }
    }, 15000);

    let dataBuffer = '';

    socket.on('data', (data) => {
        dataBuffer += data;
        let lineEndIndex;
        
        while ((lineEndIndex = dataBuffer.indexOf('\n')) !== -1) {
            const message = dataBuffer.substring(0, lineEndIndex).trim();
            dataBuffer = dataBuffer.substring(lineEndIndex + 1);
            
            if (message && message !== 'PONG') {
                console.log(`[Relaying] -> ${message}`);
                // Broadcast to all active consoles in the network
                clients.forEach((client) => {
                    if (client !== socket && client.writable) {
                        client.write(`${message}\n`);
                    }
                });
            }
        }
    });

    socket.on('end', () => {
        console.log(`[-] Console disconnected: ${clientAddress}`);
        cleanup();
    });

    socket.on('error', (err) => {
        console.error(`[!] Socket error (${clientAddress}):`, err.message);
        cleanup();
    });

    function cleanup() {
        clearInterval(pingInterval);
        clients = clients.filter((c) => c !== socket);
        socket.destroy();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PictoChat3DS Centralized Cloud Host active on port ${PORT}`);
});
